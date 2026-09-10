import { expect, test } from 'bun:test'
import { clientEnvSchema } from '@codebuff/common/env-schema'
import { TEST_AGENT_RUNTIME_IMPL } from '@codebuff/common/testing/fixtures/agent-runtime'
import { getInitialSessionState } from '@codebuff/common/types/session-state'
import { promptSuccess } from '@codebuff/common/util/error'
import { assembleLocalAgentTemplates } from '@codebuff/agent-runtime/templates/agent-registry'
import { runAgentStep } from '@codebuff/agent-runtime/run-agent-step'
import { validateAndGetAgentTemplate } from '@codebuff/agent-runtime/tools/handlers/tool/spawn-agent-utils'
import {
  createToolCallChunk,
  mockFileContext,
} from '@codebuff/agent-runtime/__tests__/test-utils'
import { bundledAgents } from '../agents/bundled-agents.generated'
import { AGENT_MODE_TO_ID } from '../utils/constants'

// Exercise the actual CLI mode routing and generated definitions: a synthetic
// researcher fixture cannot catch missing tools on the product's entry point.
test.each(['DEFAULT', 'LITE'] as const)(
  '%s can search with a subscription and hides search without a provider',
  async (mode) => {
    const agentId = AGENT_MODE_TO_ID[mode]
    const fileContext = { ...mockFileContext, agentTemplates: bundledAgents }
    const signal = new AbortController().signal
    const webSearch = async (input: {
      query: string
      signal?: AbortSignal
    }) => {
      expect(input.query).toBe('Bun')
      expect(input.signal).toBe(signal)
      return {
        result: 'Bun runs TypeScript. https://bun.sh/docs',
        creditsUsed: 0,
      }
    }
    const { agentTemplates } = assembleLocalAgentTemplates({
      fileContext,
      logger: TEST_AGENT_RUNTIME_IMPL.logger,
      ciEnv: {},
      webSearch,
    })
    const root = agentTemplates[agentId]
    expect(root.toolNames).toContain('web_search')
    expect(root.toolNames).toContain('read_url')
    const withoutSearch = assembleLocalAgentTemplates({
      fileContext,
      logger: TEST_AGENT_RUNTIME_IMPL.logger,
      ciEnv: {},
    })
    expect(withoutSearch.agentTemplates[agentId].toolNames).not.toContain(
      'web_search',
    )

    const agentState = getInitialSessionState(fileContext).mainAgentState
    await runAgentStep({
      ...TEST_AGENT_RUNTIME_IMPL,
      ciEnv: {},
      webSearch,
      signal,
      fileContext,
      agentState,
      clientEnv: clientEnvSchema.parse({}),
      fetch: (async () => {
        throw new Error('Unexpected network request')
      }) as unknown as typeof fetch,
      additionalToolDefinitions: async () => ({}),
      agentType: agentId,
      agentTemplate: root,
      localAgentTemplates: agentTemplates,
      ancestorRunIds: [],
      clientSessionId: 'session',
      fingerprintId: 'fingerprint',
      repoId: undefined,
      repoUrl: undefined,
      runId: 'run',
      spawnParams: undefined,
      system: root.systemPrompt,
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
  },
)

test('DEFAULT can delegate to the shipped web researcher without granting search to restricted agents', async () => {
  const { agentTemplates } = assembleLocalAgentTemplates({
    fileContext: { ...mockFileContext, agentTemplates: bundledAgents },
    logger: TEST_AGENT_RUNTIME_IMPL.logger,
    ciEnv: {},
    webSearch: async () => ({ result: 'https://bun.sh/docs' }),
  })
  const { agentTemplate } = await validateAndGetAgentTemplate({
    ...TEST_AGENT_RUNTIME_IMPL,
    localAgentTemplates: agentTemplates,
    agentTypeStr: 'researcher-web',
    parentAgentTemplate: agentTemplates[AGENT_MODE_TO_ID.DEFAULT],
  })
  expect(agentTemplate.toolNames).toContain('web_search')
  expect(agentTemplate.toolNames).toContain('read_url')
  expect(agentTemplates['file-picker'].toolNames).not.toContain('web_search')
})
