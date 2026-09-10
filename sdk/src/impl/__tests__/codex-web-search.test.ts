import { afterEach, expect, test } from 'bun:test'

import {
  createCodexWebSearch,
  setByokSearchProfile,
} from '../fork-impls/codex-web-search'
import { getForkHooks } from '../fork-hooks'

const profile = {
  provider: 'openai' as const,
  baseUrl: 'https://chatgpt.com/backend-api',
  apiKey: '',
  oauthProfileId: 'codex-one',
  model: 'openai/gpt-6-astra',
}
const credentials = {
  accessToken: `x.${Buffer.from(JSON.stringify({ 'https://api.openai.com/auth': { chatgpt_account_id: 'account-one' } })).toString('base64url')}.x`,
  refreshToken: '',
  expiresAt: Date.now() + 3600000,
  connectedAt: 0,
}
const searched = {
  type: 'response.output_item.done',
  item: {
    type: 'web_search_call',
    status: 'completed',
    action: { type: 'search', query: 'Bun' },
  },
}
const delta = {
  type: 'response.output_text.delta',
  item_id: 'message-one',
  content_index: 0,
  delta: 'Bun runs TypeScript.',
}
const citation = {
  type: 'response.output_text.annotation.added',
  annotation: {
    type: 'url_citation',
    title: 'Bun docs',
    url: 'https://bun.sh/docs',
    start_index: 0,
    end_index: 20,
  },
}
const completed = {
  type: 'response.completed',
  response: { status: 'completed', output: [] },
}

function stream(events: unknown[], suffix = '') {
  const bytes = new TextEncoder().encode(
    events.map((event) => `data: ${JSON.stringify(event)}\r\n\r\n`).join('') +
      suffix,
  )
  // Splits inside both JSON and SSE delimiters, including CRLF boundaries.
  return new Response(
    new ReadableStream({
      start(controller) {
        for (let i = 0; i < bytes.length; i += 7)
          controller.enqueue(bytes.slice(i, i + 7))
        controller.close()
      },
    }),
    { headers: { 'Content-Type': 'text/event-stream' } },
  )
}

function search(events: unknown[], suffix = '') {
  return createCodexWebSearch(profile, {
    getCredentials: async () => credentials,
    fetch: (async () => stream(events, suffix)) as unknown as typeof fetch,
  })
}

afterEach(() => setByokSearchProfile(null))

test('hosted search collects streamed citations when completed output is empty, using only Codex search', async () => {
  const fn = createCodexWebSearch(profile, {
    getCredentials: async (id) => {
      expect(id).toBe('codex-one')
      return credentials
    },
    fetch: (async (url, init) => {
      expect(String(url)).toBe(
        'https://chatgpt.com/backend-api/codex/responses',
      )
      const headers = new Headers(init?.headers)
      expect(headers.get('chatgpt-account-id')).toBe('account-one')
      expect(headers.get('Authorization')).toBe(
        `Bearer ${credentials.accessToken}`,
      )
      expect(init?.redirect).toBe('error')
      const body = JSON.parse(init?.body as string)
      expect(body.model).toBe('gpt-6-astra')
      expect(body.tools).toEqual([
        { type: 'web_search', external_web_access: true },
      ])
      expect(body.tool_choice).toBe('required')
      expect(body.stream).toBe(true)
      expect(body.store).toBe(false)
      return stream([searched, delta, citation, completed])
    }) as typeof fetch,
  })
  const result = await fn({ query: 'Bun' })
  expect(result.error).toBeUndefined()
  expect(result.result).toContain('Bun runs TypeScript.')
  expect(result.result).toContain('https://bun.sh/docs')
  expect(result.creditsUsed).toBe(0)
})

test.each([
  ['truncated', [searched, delta, citation]],
  ['no search', [delta, citation, completed]],
  ['no sources', [searched, delta, completed]],
  ['no answer', [searched, citation, completed]],
  [
    'failed',
    [
      searched,
      delta,
      citation,
      { type: 'response.failed', response: { status: 'failed' } },
    ],
  ],
  [
    'incomplete',
    [
      searched,
      delta,
      citation,
      { type: 'response.incomplete', response: { status: 'incomplete' } },
    ],
  ],
  [
    'false completion',
    [
      searched,
      delta,
      citation,
      { type: 'response.completed', response: { status: 'failed' } },
    ],
  ],
])('rejects %s search streams', async (_label, events) => {
  const result = await search(events)({ query: 'Bun' })
  expect(result.error).toBeTruthy()
  expect(result.result).toBeUndefined()
})

test('malformed SSE does not become a partial success', async () => {
  const result = await search(
    [searched, delta, citation],
    'data: {broken}\n\n',
  )({ query: 'Bun' })
  expect(result.error).toBeTruthy()
})

test('completed message items supply text and citations without duplicating deltas', async () => {
  const item = {
    id: 'message-one',
    type: 'message',
    status: 'completed',
    role: 'assistant',
    content: [
      {
        type: 'output_text',
        text: 'Bun runs TypeScript.',
        annotations: [citation.annotation],
      },
    ],
  }
  const result = await search([
    {
      type: 'response.web_search_call.completed',
      item_id: 'search-one',
      output_index: 0,
    },
    delta,
    { type: 'response.output_item.done', item, output_index: 1 },
    {
      type: 'response.completed',
      response: { status: 'completed', output: [item] },
    },
  ])({ query: 'Bun' })
  expect(result.error).toBeUndefined()
  expect(result.result?.match(/Bun runs TypeScript\./g)?.length).toBe(1)
  expect(result.result?.match(/https:\/\/bun.sh\/docs/g)?.length).toBe(1)
})

test.each([
  'javascript:alert(1)',
  'not a URL',
  'https://secret:token@example.com',
])('rejects unusable citation URL %s', async (url) => {
  const result = await search([
    searched,
    delta,
    { ...citation, annotation: { ...citation.annotation, url } },
    completed,
  ])({ query: 'Bun' })
  expect(result.error).toBeTruthy()
  expect(result.result).toBeUndefined()
})

test('HTTP failures return status without reflecting response bodies or tokens', async () => {
  const fn = createCodexWebSearch(profile, {
    getCredentials: async () => credentials,
    fetch: (async () =>
      new Response('private response body', {
        status: 401,
      })) as unknown as typeof fetch,
  })
  const result = await fn({ query: 'Bun' })
  expect(result.error).toContain('401')
  expect(result.error).not.toContain('private response body')
  expect(result.error).not.toContain(credentials.accessToken)
})

test('oversized responses fail before accumulating unbounded output', async () => {
  const fn = createCodexWebSearch(profile, {
    getCredentials: async () => credentials,
    fetch: (async () =>
      new Response(' '.repeat(4 * 1024 * 1024 + 1))) as unknown as typeof fetch,
  })
  expect((await fn({ query: 'Bun' })).error).toContain('size limit')
})

test('cancellation stops a pending stream and returns an error', async () => {
  const controller = new AbortController()
  let cancelled = false
  const fn = createCodexWebSearch(profile, {
    getCredentials: async () => credentials,
    fetch: (async () =>
      new Response(
        new ReadableStream({
          cancel() {
            cancelled = true
          },
        }),
      )) as unknown as typeof fetch,
  })
  const pending = fn({ query: 'Bun', signal: controller.signal })
  setTimeout(() => controller.abort(), 10)
  expect((await pending).error).toMatch(/cancel|abort/i)
  expect(cancelled).toBe(true)
})

test('missing credentials and pre-aborted calls never send a search request', async () => {
  const fn = createCodexWebSearch(profile, {
    getCredentials: async () => null,
    fetch: (async () => {
      throw new Error('unexpected fetch')
    }) as unknown as typeof fetch,
  })
  expect((await fn({ query: 'Bun' })).error).toMatch(/connect|sign in/i)
  expect(
    (await fn({ query: 'Bun', signal: AbortSignal.abort() })).error,
  ).toMatch(/cancel|abort/i)
})

test('SDK captures search profile per run, rejects other providers and can clear search', () => {
  setByokSearchProfile(profile)
  const captured = getForkHooks().getWebSearch?.()
  expect(captured).toBeFunction()
  expect(() => setByokSearchProfile({ ...profile, provider: 'grok' })).toThrow()
  setByokSearchProfile(null)
  expect(getForkHooks().getWebSearch?.()).toBeUndefined()
  expect(captured).toBeFunction()
})
