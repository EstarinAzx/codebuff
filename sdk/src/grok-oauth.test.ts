import { afterEach, beforeEach, expect, test } from 'bun:test'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'

let directory: string
beforeEach(() => {
  directory = fs.mkdtempSync(path.join(os.tmpdir(), 'grok-oauth-'))
})
afterEach(() => {
  fs.rmSync(directory, { recursive: true, force: true })
})

const device = {
  device_code: 'private-device-code',
  user_code: 'ABCD-EFGH',
  verification_uri: 'https://accounts.x.ai/oauth2/device',
  verification_uri_complete:
    'https://accounts.x.ai/oauth2/device?user_code=ABCD-EFGH',
  expires_in: 60,
  interval: 1,
}
const token = {
  access_token: 'access-secret',
  refresh_token: 'refresh-secret',
  expires_in: 3600,
  token_type: 'Bearer',
}

test('device login handles pending and slow_down before accepting a token', async () => {
  const { startGrokDeviceLogin } = await import('./grok-oauth')
  const requests: { url: string; body: URLSearchParams; at: number }[] = []
  const fetchImpl = (async (url: RequestInfo | URL, init?: RequestInit) => {
    expect(init?.redirect).toBe('error')
    expect(init?.signal).toBeInstanceOf(AbortSignal)
    requests.push({
      url: String(url),
      body: new URLSearchParams(String(init?.body)),
      at: Date.now(),
    })
    switch (requests.length) {
      case 1:
        return Response.json(device)
      case 2:
        return Response.json(
          { error: 'authorization_pending' },
          { status: 400 },
        )
      case 3:
        return Response.json({ error: 'slow_down' }, { status: 400 })
      default:
        return Response.json(token)
    }
  }) as unknown as typeof fetch
  const login = await startGrokDeviceLogin({ fetchImpl })
  expect(login.userCode).toBe('ABCD-EFGH')
  expect(login.verificationUri).toBe(device.verification_uri_complete)
  expect(await login.waitForCredentials()).toMatchObject({
    accessToken: 'access-secret',
    refreshToken: 'refresh-secret',
  })
  expect(requests[0].url).toBe('https://auth.x.ai/oauth2/device/code')
  expect(requests[0].body.get('scope')).toContain('grok-cli:access')
  expect(requests[1].body.get('grant_type')).toBe(
    'urn:ietf:params:oauth:grant-type:device_code',
  )
  expect(requests[3].at - requests[2].at).toBeGreaterThanOrEqual(5900)
}, 15_000)

test('device login rejects untrusted verification URLs and malformed lifetimes', async () => {
  const { startGrokDeviceLogin } = await import('./grok-oauth')
  for (const overrides of [
    { verification_uri_complete: 'https://evil.example/?code=secret' },
    { verification_uri: 'http://auth.x.ai/device' },
    { expires_in: 0 },
    { interval: -1 },
    { device_code: '' },
  ]) {
    await expect(
      startGrokDeviceLogin({
        fetchImpl: (async () =>
          Response.json({
            ...device,
            ...overrides,
          })) as unknown as typeof fetch,
      }),
    ).rejects.toThrow()
  }
})

test('denial, cancellation and malformed tokens fail without exposing response secrets', async () => {
  const { startGrokDeviceLogin } = await import('./grok-oauth')
  for (const payload of [
    { error: 'access_denied', error_description: 'private-secret' },
    { ...token, access_token: '' },
  ]) {
    let count = 0
    const login = await startGrokDeviceLogin({
      fetchImpl: (async () =>
        ++count === 1
          ? Response.json(device)
          : Response.json(payload, {
              status: 'error' in payload ? 400 : 200,
            })) as unknown as typeof fetch,
    })
    await expect(login.waitForCredentials()).rejects.toThrow(/Grok/)
  }
  const controller = new AbortController()
  const login = await startGrokDeviceLogin({
    signal: controller.signal,
    fetchImpl: (async () => Response.json(device)) as unknown as typeof fetch,
  })
  controller.abort()
  await expect(login.waitForCredentials()).rejects.toThrow()
})

test('refresh is coalesced, rotates credentials per profile and cannot resurrect removed credentials', async () => {
  const oauth = await import('./grok-oauth')
  const filePath = path.join(directory, 'grok.json')
  const old = {
    accessToken: 'old-access',
    refreshToken: 'old-refresh',
    expiresAt: 0,
    connectedAt: 1,
  }
  oauth.saveGrokCredentials('a', old, filePath)
  oauth.saveGrokCredentials(
    'b',
    { ...old, accessToken: 'other-access' },
    filePath,
  )
  let requests = 0
  const fetchImpl = (async (_url: RequestInfo | URL, init?: RequestInit) => {
    requests++
    expect(new URLSearchParams(String(init?.body)).get('refresh_token')).toBe(
      'old-refresh',
    )
    await new Promise((resolve) => setTimeout(resolve, 10))
    return Response.json(token)
  }) as unknown as typeof fetch
  const [a, b] = await Promise.all([
    oauth.getValidGrokCredentials('a', { filePath, fetchImpl }),
    oauth.getValidGrokCredentials('a', { filePath, fetchImpl }),
  ])
  expect(requests).toBe(1)
  expect(a).toEqual(b)
  expect(a?.refreshToken).toBe('refresh-secret')
  expect(oauth.getGrokCredentials('b', filePath)?.accessToken).toBe(
    'other-access',
  )
  oauth.saveGrokCredentials('a', old, filePath)
  const pending = oauth.getValidGrokCredentials('a', { filePath, fetchImpl })
  oauth.clearGrokCredentials('a', filePath)
  expect(await pending).toBeNull()
  expect(oauth.getGrokCredentials('a', filePath)).toBeNull()
})

test('malformed refresh responses preserve saved credentials and corrupt stores are never overwritten', async () => {
  const oauth = await import('./grok-oauth')
  const filePath = path.join(directory, 'grok.json')
  const old = {
    accessToken: 'old',
    refreshToken: 'refresh',
    expiresAt: 0,
    connectedAt: 1,
  }
  oauth.saveGrokCredentials('a', old, filePath)
  await expect(
    oauth.getValidGrokCredentials('a', {
      filePath,
      fetchImpl: (async () =>
        Response.json({ ...token, expires_in: -1 })) as unknown as typeof fetch,
    }),
  ).rejects.toThrow()
  expect(oauth.getGrokCredentials('a', filePath)).toEqual(old)
  fs.writeFileSync(filePath, 'broken json')
  expect(() => oauth.saveGrokCredentials('b', old, filePath)).toThrow()
  expect(fs.readFileSync(filePath, 'utf8')).toBe('broken json')
})

test('catalog requests use the fixed subscription proxy and reject oversized bodies', async () => {
  const { fetchGrokModels, startGrokDeviceLogin } = await import('./grok-oauth')
  const models = await fetchGrokModels('access-secret', (async (
    url: RequestInfo | URL,
    init?: RequestInit,
  ) => {
    expect(String(url)).toBe('https://cli-chat-proxy.grok.com/v1/models')
    const headers = new Headers(init?.headers)
    expect(headers.get('authorization')).toBe('Bearer access-secret')
    expect(headers.get('x-xai-token-auth')).toBe('xai-grok-cli')
    expect(init?.redirect).toBe('error')
    return Response.json({
      models: [
        { id: 'grok-4.6' },
        { id: 'future-grok' },
        { id: 'grok-4.6' },
        null,
        { id: 'bad\nheader' },
      ],
    })
  }) as unknown as typeof fetch)
  expect(models).toEqual(['grok-4.6', 'future-grok'])
  await expect(
    startGrokDeviceLogin({
      fetchImpl: (async () =>
        new Response('x'.repeat(70_000))) as unknown as typeof fetch,
    }),
  ).rejects.toThrow(/large|limit/i)
})
