import { afterEach, beforeEach, expect, test } from 'bun:test'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { generateText, Output, streamText, tool } from 'ai'
import { z } from 'zod/v4'
import { createGrokModel } from '../fork-impls/grok-model'
import { saveGrokCredentials } from '../../grok-oauth'
import {
  getModelForRequest,
  setActiveByokProfile,
  setByokAgentBindings,
} from '../model-provider'

let directory: string
const originalFetch = globalThis.fetch
const previousPath = process.env.CODEBUFF_GROK_CREDENTIALS_PATH
beforeEach(() => {
  directory = fs.mkdtempSync(path.join(os.tmpdir(), 'grok-provider-'))
  process.env.CODEBUFF_GROK_CREDENTIALS_PATH = path.join(directory, 'grok.json')
  saveGrokCredentials('grok-a', {
    accessToken: 'grok-secret',
    refreshToken: 'refresh',
    expiresAt: Date.now() + 3_600_000,
    connectedAt: 1,
  })
})
afterEach(() => {
  globalThis.fetch = originalFetch
  setActiveByokProfile(null)
  setByokAgentBindings({})
  if (previousPath === undefined)
    delete process.env.CODEBUFF_GROK_CREDENTIALS_PATH
  else process.env.CODEBUFF_GROK_CREDENTIALS_PATH = previousPath
  fs.rmSync(directory, { recursive: true, force: true })
})
const profile = {
  provider: 'grok' as const,
  baseUrl: 'https://untrusted.example',
  apiKey: '',
  oauthProfileId: 'grok-a',
  model: 'grok-4.6',
}
function sse(events: unknown[]) {
  return new Response(
    events.map((event) => `data: ${JSON.stringify(event)}\n\n`).join(''),
    { headers: { 'content-type': 'text/event-stream' } },
  )
}

test('Grok binding routes a complete tool round trip through subscription Responses without Codex fallback', async () => {
  setActiveByokProfile({
    provider: 'openai',
    baseUrl: 'https://other.example',
    apiKey: 'other',
  })
  setByokAgentBindings({ worker: profile })
  const resolved = await getModelForRequest({
    apiKey: '',
    model: 'ignored-template-model',
    agentId: 'worker',
  })
  expect(resolved.isChatGptOAuth).toBe(false)
  expect((resolved.model as { modelId: string }).modelId).toBe('grok-4.6')
  const bodies: Record<string, any>[] = []
  globalThis.fetch = (async (url, init) => {
    expect(String(url)).toBe('https://cli-chat-proxy.grok.com/v1/responses')
    const headers = new Headers(init?.headers)
    expect(headers.get('authorization')).toBe('Bearer grok-secret')
    expect(headers.get('x-grok-model-override')).toBe('grok-4.6')
    expect(headers.get('chatgpt-account-id')).toBeNull()
    expect(init?.redirect).toBe('error')
    const body = JSON.parse(String(init?.body))
    bodies.push(body)
    expect(body.model).toBe('grok-4.6')
    expect(body.instructions).toContain('Use the file tool')
    expect(body.reasoning?.summary).toBeUndefined()
    expect(body.text?.verbosity).toBeUndefined()
    expect(
      body.input.every(
        (item: any) => !['system', 'developer'].includes(item.role),
      ),
    ).toBe(true)
    const events = [
      { type: 'response.created', response: { id: 'r1', model: 'grok-4.6' } },
    ]
    if (bodies.length === 1) {
      return sse([
        ...events,
        { type: 'response.reasoning_text.delta', delta: 'Checking the file.' },
        {
          type: 'response.output_item.added',
          output_index: 1,
          item: { type: 'function_call', call_id: 'call1', name: 'read_file' },
        },
        {
          type: 'response.function_call_arguments.delta',
          output_index: 1,
          delta: '{"path":"README.md"}',
        },
        {
          type: 'response.completed',
          response: {
            status: 'completed',
            usage: { input_tokens: 10, output_tokens: 4, total_tokens: 14 },
          },
        },
      ])
    }
    return sse([
      ...events,
      { type: 'response.output_text.delta', delta: 'GROK_TOOL_OK' },
      {
        type: 'response.completed',
        response: {
          status: 'completed',
          usage: { input_tokens: 20, output_tokens: 5, total_tokens: 25 },
        },
      },
    ])
  }) as typeof fetch
  const messages = [
    { role: 'system' as const, content: 'Use the file tool' },
    { role: 'user' as const, content: 'Read the readme' },
  ]
  const tools = {
    read_file: tool({ inputSchema: z.object({ path: z.string() }) }),
  }
  const first = streamText({
    model: resolved.model,
    messages,
    tools,
    maxRetries: 0,
    allowSystemInMessages: true,
  })
  const firstParts = []
  for await (const part of first.fullStream) firstParts.push(part)
  expect(firstParts.find((part) => part.type === 'tool-call')).toMatchObject({
    toolCallId: 'call1',
    toolName: 'read_file',
    input: { path: 'README.md' },
  })
  expect(firstParts.some((part) => part.type === 'reasoning-delta')).toBe(true)
  const second = streamText({
    model: resolved.model,
    tools,
    maxRetries: 0,
    allowSystemInMessages: true,
    messages: [
      ...messages,
      ...(await first.response).messages,
      {
        role: 'tool',
        content: [
          {
            type: 'tool-result',
            toolCallId: 'call1',
            toolName: 'read_file',
            output: { type: 'text', value: 'README contents' },
          },
        ],
      },
    ],
  })
  expect(await second.text).toBe('GROK_TOOL_OK')
  expect(bodies[1].input).toContainEqual({
    type: 'function_call_output',
    call_id: 'call1',
    output: 'README contents',
  })
  expect(bodies[1].input.some((item: any) => item.type === 'reasoning')).toBe(
    false,
  )
})

test('missing Grok credentials fail with Grok reconnect guidance', async () => {
  setActiveByokProfile({ ...profile, oauthProfileId: 'missing' })
  await expect(
    getModelForRequest({ apiKey: '', model: 'grok-4.6' }),
  ).rejects.toThrow('/providers:add grok')
})

test('non-streaming runtime helpers receive text, tool calls and usage', async () => {
  globalThis.fetch = (async () =>
    sse([
      { type: 'response.created', response: { id: 'r2', model: 'grok-4.6' } },
      { type: 'response.output_text.delta', delta: 'Looking up the file.' },
      {
        type: 'response.output_item.added',
        output_index: 0,
        item: { type: 'function_call', call_id: 'c2', name: 'read_file' },
      },
      {
        type: 'response.function_call_arguments.delta',
        output_index: 0,
        delta: '{"path":',
      },
      {
        type: 'response.function_call_arguments.delta',
        output_index: 0,
        delta: '"README.md"}',
      },
      {
        type: 'response.completed',
        response: {
          status: 'completed',
          usage: { input_tokens: 10, output_tokens: 8, total_tokens: 18 },
        },
      },
    ])) as unknown as typeof fetch
  const result = await generateText({
    model: createGrokModel('grok-4.6', 'secret'),
    prompt: 'Read the readme',
    tools: { read_file: tool({ inputSchema: z.object({ path: z.string() }) }) },
    maxRetries: 0,
  })
  expect(result.text).toBe('Looking up the file.')
  expect(result.toolCalls[0]).toMatchObject({
    toolName: 'read_file',
    input: { path: 'README.md' },
  })
  expect(result.usage.outputTokens).toBe(8)
})

test('structured output schemas reach the Responses endpoint and return validated objects', async () => {
  let body: Record<string, any> = {}
  globalThis.fetch = (async (_url, init) => {
    body = JSON.parse(String(init?.body))
    return sse([
      { type: 'response.created', response: { id: 'r3', model: 'grok-4.6' } },
      { type: 'response.output_text.delta', delta: '{"answer":42}' },
      {
        type: 'response.completed',
        response: {
          status: 'completed',
          usage: { input_tokens: 4, output_tokens: 5, total_tokens: 9 },
        },
      },
    ])
  }) as typeof fetch
  const result = await generateText({
    model: createGrokModel('grok-4.6', 'secret'),
    prompt: 'Answer',
    output: Output.object({ schema: z.object({ answer: z.number() }) }),
    maxRetries: 0,
  })
  expect(body.text?.format).toMatchObject({
    type: 'json_schema',
    schema: {
      type: 'object',
      properties: { answer: { type: 'number' } },
      required: ['answer'],
    },
  })
  expect(result.output).toEqual({ answer: 42 })
})

test('incomplete Responses streams preserve the output-limit reason and usage', async () => {
  globalThis.fetch = (async () =>
    sse([
      {
        type: 'response.created',
        response: { id: 'limited', model: 'grok-4.6' },
      },
      { type: 'response.output_text.delta', delta: 'Partial answer' },
      {
        type: 'response.incomplete',
        response: {
          status: 'incomplete',
          incomplete_details: { reason: 'max_output_tokens' },
          usage: { input_tokens: 12, output_tokens: 1, total_tokens: 13 },
        },
      },
    ])) as unknown as typeof fetch
  const result = streamText({
    model: createGrokModel('grok-4.6', 'secret'),
    prompt: 'Answer',
    maxRetries: 0,
  })
  expect(await result.text).toBe('Partial answer')
  expect(await result.finishReason).toBe('length')
  expect((await result.usage).outputTokens).toBe(1)
})
