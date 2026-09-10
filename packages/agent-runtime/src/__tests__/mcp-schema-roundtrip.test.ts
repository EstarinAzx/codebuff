import { expect, test } from 'bun:test'
import z from 'zod/v4'
import { asSchema } from 'ai'
import { getMCPToolData } from '../mcp'
import { getToolSet, fullToolList } from '../tools/prompts'
import { clientEnvSchema } from '@codebuff/common/env-schema'
import { TEST_AGENT_RUNTIME_IMPL } from '@codebuff/common/testing/fixtures/agent-runtime'
import { getInitialSessionState } from '@codebuff/common/types/session-state'
import { promptSuccess } from '@codebuff/common/util/error'
import { assembleLocalAgentTemplates } from '../templates/agent-registry'
import { loopAgentSteps, toTokenCountInputSchema } from '../run-agent-step'
import { parseRawCustomToolCall } from '../tools/tool-executor'
import {
  createToolCallChunk,
  mockFileContext,
  testResearcherAgent,
} from './test-utils'

const inputSchema = {
  type: 'object' as const,
  properties: {
    text: {
      type: 'string',
      description: 'Text to type into the selected control',
    },
    loc: {
      anyOf: [{ type: 'array', items: { type: 'integer' } }, { type: 'null' }],
      default: null,
    },
    clear: { type: 'boolean', default: false },
  },
  required: ['text'],
  additionalProperties: false,
}

test('MCP schemas survive native tool preparation with descriptions and validation intact', async () => {
  const definitions = await getMCPToolData({
    toolNames: [],
    mcpServers: {
      desktop: { type: 'stdio', command: 'unused', args: [], env: {} },
    },
    requestMcpToolData: async () => [
      { name: 'Type', description: 'Type text', inputSchema },
    ],
  })
  const tools = await getToolSet({
    toolNames: [],
    windowedFileReads: false,
    agentTools: {},
    skills: {},
    additionalToolDefinitions: async () => definitions,
  })
  const prepared = asSchema(tools.desktop__Type.inputSchema)
  expect(definitions.desktop__Type.inputSchema).toBe(inputSchema)
  expect(
    (await prepared.validate!({ text: 'test', loc: [10, 20] })).success,
  ).toBe(true)
  expect((await prepared.validate!({ text: 123 })).success).toBe(false)
  expect((await prepared.validate!({})).success).toBe(false)
  const json = await prepared.jsonSchema
  expect<unknown>(json).toEqual(inputSchema)
  expect(json.properties?.text).toEqual({
    type: 'string',
    description: inputSchema.properties.text.description,
  })
  expect(json.required).toContain('text')
  expect(fullToolList([], definitions)).toContain(
    inputSchema.properties.text.description,
  )
  expect(tools.desktop__Type).not.toBe(definitions.desktop__Type)
  expect(toTokenCountInputSchema(tools.desktop__Type.inputSchema)).toEqual(
    inputSchema,
  )
})

test.each([
  {
    name: 'uniqueItems',
    schema: {
      type: 'object',
      properties: {
        value: { type: 'array', items: { type: 'string' }, uniqueItems: true },
      },
    },
    invalid: { value: ['same', 'same'] },
    valid: { value: ['one', 'two'] },
  },
  {
    name: 'minItems without items',
    schema: {
      type: 'object',
      properties: { value: { type: 'array', minItems: 1 } },
    },
    invalid: { value: [] },
    valid: { value: ['one'] },
  },
  {
    name: 'maxProperties',
    schema: {
      type: 'object',
      properties: { value: { type: 'object', maxProperties: 1 } },
    },
    invalid: { value: { a: 'one', b: 'two' } },
    valid: { value: { a: 'one' } },
  },
])(
  'preserves $name in model schema and runtime validation',
  async ({ schema, invalid, valid }) => {
    const definitions = {
      check: {
        inputSchema: schema,
        description: 'Check input',
        endsAgentStep: false,
      },
    }
    const tools = await getToolSet({
      toolNames: [],
      windowedFileReads: false,
      agentTools: {},
      skills: {},
      additionalToolDefinitions: async () => definitions,
    })
    const prepared = asSchema(tools.check.inputSchema)
    expect<unknown>(await prepared.jsonSchema).toEqual(schema)
    expect((await prepared.validate!(invalid)).success).toBe(false)
    expect((await prepared.validate!(valid)).success).toBe(true)
    expect(
      parseRawCustomToolCall({
        customToolDefs: definitions,
        rawToolCall: { toolName: 'check', toolCallId: 'bad', input: invalid },
      }),
    ).toHaveProperty('error')
    expect(
      parseRawCustomToolCall({
        customToolDefs: definitions,
        rawToolCall: { toolName: 'check', toolCallId: 'good', input: valid },
      }),
    ).not.toHaveProperty('error')
  },
)

test('runtime step flags stay outside strict external schema validation', () => {
  const definitions = {
    check: {
      inputSchema: z.object({ text: z.string() }).strict(),
      endsAgentStep: true,
    },
  }
  const parse = (input: unknown, autoInsertEndStepParam = false) =>
    parseRawCustomToolCall({
      customToolDefs: definitions,
      rawToolCall: { toolName: 'check', toolCallId: 'call', input },
      autoInsertEndStepParam,
    })
  expect(parse(JSON.stringify({ text: 'valid', cb_easp: true }))).toEqual({
    toolName: 'check',
    toolCallId: 'call',
    input: { text: 'valid' },
  })
  expect(parse({ text: 'valid' }, true)).toEqual({
    toolName: 'check',
    toolCallId: 'call',
    input: { text: 'valid' },
  })
  expect(parse({ text: 'valid', unexpected: true }, true)).toHaveProperty(
    'error',
  )
})

test('registered Zod custom tools survive agent preparation and reject invalid execution inputs', async () => {
  const schema = z
    .object({ text: z.string().min(1).describe('Required text') })
    .describe('Echo input')
  const fileContext = {
    ...mockFileContext,
    agentTemplates: {
      researcher: { ...testResearcherAgent, toolNames: ['echo', 'end_turn'] },
    },
    customToolDefinitions: {
      echo: {
        inputSchema: schema,
        description: 'Echo text',
        endsAgentStep: false,
      },
    },
  }
  const { agentTemplates } = assembleLocalAgentTemplates({
    fileContext,
    logger: TEST_AGENT_RUNTIME_IMPL.logger,
    ciEnv: {},
  })
  const agent = agentTemplates.researcher
  const state = getInitialSessionState(fileContext).mainAgentState
  const calls: unknown[] = []
  let modelCalls = 0
  await loopAgentSteps({
    ...TEST_AGENT_RUNTIME_IMPL,
    ciEnv: {},
    clientEnv: clientEnvSchema.parse({}),
    signal: new AbortController().signal,
    fileContext,
    agentState: state,
    agentType: agent.id,
    agentTemplate: agent,
    localAgentTemplates: agentTemplates,
    ancestorRunIds: [],
    clientSessionId: 'session',
    fingerprintId: 'fingerprint',
    repoId: undefined,
    repoUrl: undefined,
    spawnParams: undefined,
    userId: undefined,
    userInputId: 'input',
    onResponseChunk: () => {},
    prompt: 'Echo checked',
    promptAiSdkStream: async function* (params) {
      modelCalls++
      expect(modelCalls).toBeLessThanOrEqual(3)
      const prepared = params.tools?.echo.inputSchema as z.ZodType
      expect(z.toJSONSchema(prepared, { io: 'input' }).required).toContain(
        'text',
      )
      if (modelCalls === 1) yield createToolCallChunk('echo', { text: 123 })
      else if (modelCalls === 2)
        yield createToolCallChunk('echo', { text: 'checked' })
      else {
        yield { type: 'text', text: 'Finished checking the tool.' }
        yield createToolCallChunk('end_turn', {})
      }
      return promptSuccess('message')
    },
    requestToolCall: async ({ toolName, input }) => {
      expect(toolName).toBe('echo')
      calls.push(input)
      return { output: [{ type: 'json', value: 'Echo checked' }] }
    },
  })
  expect(calls).toEqual([{ text: 'checked' }])
  expect(JSON.stringify(state.messageHistory)).toContain('Echo checked')
  expect(fileContext.customToolDefinitions.echo.inputSchema).toBe(schema)
})
