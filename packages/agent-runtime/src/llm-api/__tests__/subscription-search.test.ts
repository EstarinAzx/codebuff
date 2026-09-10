import { expect, test } from 'bun:test'
import { clientEnvSchema } from '@codebuff/common/env-schema'
import { TEST_AGENT_RUNTIME_IMPL as agentRuntimeDeps } from '@codebuff/common/testing/fixtures/agent-runtime'
import { callWebSearchAPI } from '../codebuff-web-api'
import { gateByokWebTools } from '../fork-impls/byok-web-tools'
import { extractSubagentContextParams } from '../../tools/handlers/tool/spawn-agent-utils'
import { assembleLocalAgentTemplates } from '../../templates/agent-registry'
import { runAgentStep } from '../../run-agent-step'
import {
  createToolCallChunk,
  mockFileContext,
  testResearcherAgent,
} from '../../__tests__/test-utils'
import { getInitialSessionState } from '@codebuff/common/types/session-state'
import { promptSuccess } from '@codebuff/common/util/error'

test('subscription search stays advertised without service keys and reaches spawned agents', async () => {
  const signal = new AbortController().signal
  const webSearch = async (input: {
    query: string
    depth?: string
    signal?: AbortSignal
  }) => {
    expect(input).toEqual({ query: 'Bun', depth: 'deep', signal })
    return { result: 'Bun https://bun.sh/docs', creditsUsed: 0 }
  }
  const templates = { researcher: { toolNames: ['web_search', 'read_docs'] } }
  expect(
    gateByokWebTools(templates, {}, webSearch).researcher.toolNames,
  ).toContain('web_search')
  expect(gateByokWebTools(templates, {}).researcher.toolNames).not.toContain(
    'web_search',
  )
  // Exercise the explicit dependency copy: a dropped optional dependency silently
  // leaves children trying legacy search providers despite parent availability.
  const child = extractSubagentContextParams({
    ...agentRuntimeDeps,
    webSearch,
    signal,
    clientSessionId: 'session',
    fileContext: mockFileContext,
    localAgentTemplates: {},
    repoId: undefined,
    repoUrl: undefined,
    userId: undefined,
  })
  const result = await callWebSearchAPI({
    query: 'Bun',
    depth: 'deep',
    signal,
    webSearch: child.webSearch,
    fetch: (async () => {
      throw new Error('Unexpected legacy fetch')
    }) as unknown as typeof fetch,
    logger: agentRuntimeDeps.logger,
    env: { clientEnv: clientEnvSchema.parse({}), ciEnv: {} },
  })
  expect(result).toEqual({ result: 'Bun https://bun.sh/docs', creditsUsed: 0 })
})

test('researcher tool round trip returns sourced subscription results without search API keys', async () => {
  const signal = new AbortController().signal
  const webSearch = async (input: { query: string; signal?: AbortSignal }) => {
    expect(input.query).toBe('Bun')
    expect(input.signal).toBe(signal)
    return {
      result: 'Bun runs TypeScript. https://bun.sh/docs',
      creditsUsed: 0,
    }
  }
  const fileContext = {
    ...mockFileContext,
    agentTemplates: { researcher: testResearcherAgent },
  }
  const { agentTemplates } = assembleLocalAgentTemplates({
    fileContext,
    logger: agentRuntimeDeps.logger,
    ciEnv: {},
    webSearch,
  })
  const agentState = getInitialSessionState(fileContext).mainAgentState
  await runAgentStep({
    ...agentRuntimeDeps,
    ciEnv: {},
    webSearch,
    signal,
    fileContext,
    agentState,
    clientEnv: clientEnvSchema.parse({}),
    additionalToolDefinitions: async () => ({}),
    agentType: 'researcher',
    agentTemplate: agentTemplates.researcher,
    localAgentTemplates: agentTemplates,
    ancestorRunIds: [],
    clientSessionId: 'session',
    fingerprintId: 'fingerprint',
    repoId: undefined,
    repoUrl: undefined,
    runId: 'run',
    spawnParams: undefined,
    system: 'Search with sources.',
    tools: {},
    userId: undefined,
    userInputId: 'input',
    onResponseChunk: () => {},
    prompt: 'Search for Bun',
    promptAiSdkStream: async function* () {
      yield createToolCallChunk('web_search', { query: 'Bun' })
      yield createToolCallChunk('end_turn', {})
      return promptSuccess('message')
    },
  })
  const result = agentState.messageHistory.find(
    (message) => message.role === 'tool' && message.toolName === 'web_search',
  )
  expect(JSON.stringify(result)).toContain('https://bun.sh/docs')
  expect(JSON.stringify(result)).not.toContain('errorMessage')
})
