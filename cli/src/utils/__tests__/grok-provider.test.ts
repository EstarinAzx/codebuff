import { afterEach, beforeEach, expect, test } from 'bun:test'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import {
  getActiveByokProfile,
  getGrokCredentials,
  setActiveByokProfile,
  setByokAgentBindings,
} from '@codebuff/sdk'
import * as commands from '../../commands/providers'
import {
  addProfile,
  buildSdkBindings,
  getActiveProfile,
  loadProfiles,
  setAgentBinding,
} from '../providers'
import { clearCachedModels, getModelsForPreset } from '../providers-models'

let directory: string
const envKeys = [
  'CODEBUFF_PROVIDERS_PATH',
  'CODEBUFF_MODELS_CACHE_PATH',
  'CODEBUFF_GROK_CREDENTIALS_PATH',
] as const
const oldEnv = Object.fromEntries(envKeys.map((key) => [key, process.env[key]]))
const originalFetch = globalThis.fetch
const credentials = {
  accessToken: 'grok-secret',
  refreshToken: 'refresh',
  connectedAt: 1,
  expiresAt: Date.now() + 3_600_000,
}
beforeEach(() => {
  directory = fs.mkdtempSync(path.join(os.tmpdir(), 'grok-cli-'))
  for (const key of envKeys)
    process.env[key] = path.join(directory, `${key}.json`)
})
afterEach(() => {
  for (const key of envKeys) {
    if (oldEnv[key] === undefined) delete process.env[key]
    else process.env[key] = oldEnv[key]
  }
  globalThis.fetch = originalFetch
  setActiveByokProfile(null)
  setByokAgentBindings({})
  fs.rmSync(directory, { recursive: true, force: true })
})

test('Grok login activates only after approval, supports binding and removes its credentials', async () => {
  const existing = addProfile({
    name: 'Existing',
    preset: 'openai',
    apiKey: 'other-key',
  })
  setActiveByokProfile(existing)
  let approve!: (value: typeof credentials) => void
  const pending = new Promise<typeof credentials>((resolve) => {
    approve = resolve
  })
  const flow = await commands.handleProvidersAddGrok(
    'grok Work account',
    async () => ({
      userCode: 'ABCD-EFGH',
      verificationUri: 'https://auth.x.ai/device',
      waitForCredentials: () => pending,
    }),
    async () => true,
  )
  expect(flow.initial).toContain('ABCD-EFGH')
  expect(getActiveProfile()?.id).toBe(existing.id)
  expect(getActiveByokProfile()?.apiKey).toBe('other-key')
  approve(credentials)
  expect(await flow.completion).toContain('Connected')
  const grok = getActiveProfile()!
  expect(grok).toMatchObject({
    preset: 'grok',
    name: 'Work account',
    apiKey: '',
  })
  expect(getGrokCredentials(grok.id)).toEqual(credentials)
  expect(getActiveByokProfile()?.provider).toBe('grok')
  setAgentBinding('worker', grok.id)
  expect(buildSdkBindings().worker).toMatchObject({
    provider: 'grok',
    oauthProfileId: grok.id,
  })
  expect(commands.handleProvidersRemove(grok.id)).toContain(
    'Dropped stored OAuth tokens',
  )
  expect(getGrokCredentials(grok.id)).toBeNull()
  expect(buildSdkBindings()).toEqual({})
  expect(getActiveProfile()?.id).toBe(existing.id)
})

test('denied Grok login leaves profiles and active SDK state intact', async () => {
  const existing = addProfile({
    name: 'Existing',
    preset: 'openai',
    apiKey: 'other-key',
  })
  setActiveByokProfile(existing)
  const flow = await commands.handleProvidersAddGrok(
    'grok',
    async () => ({
      userCode: 'ABCD-EFGH',
      verificationUri: 'https://auth.x.ai/device',
      waitForCredentials: async () => {
        throw new Error('Grok login was denied.')
      },
    }),
    async () => true,
  )
  expect(await flow.completion).toContain('denied')
  expect(loadProfiles()).toHaveLength(1)
  expect(getActiveProfile()?.id).toBe(existing.id)
  expect(getActiveByokProfile()?.apiKey).toBe('other-key')
})

test('credential cleanup failure preserves the Grok profile and active SDK state', () => {
  const grok = addProfile({ preset: 'grok', name: 'Grok' })
  setActiveByokProfile(grok)
  fs.writeFileSync(process.env.CODEBUFF_GROK_CREDENTIALS_PATH!, 'corrupt')
  expect(commands.handleProvidersRemove(grok.id)).toContain('Could not remove')
  expect(getActiveProfile()?.id).toBe(grok.id)
  expect(getActiveByokProfile()?.oauthProfileId).toBe(grok.id)
})

test('Grok model discovery isolates account caches and labels offline fallback', async () => {
  let requests = 0
  const fetchImpl = (async () => {
    requests++
    return Response.json({
      data: [{ id: requests === 1 ? 'grok-account-a' : 'grok-account-b' }],
    })
  }) as unknown as typeof fetch
  const options = {
    preset: 'grok' as const,
    baseUrl: 'https://untrusted.example',
    apiKey: '',
    oauthProfileId: 'a',
    getGrokCredentials: async () => credentials,
    fetchImpl,
  }
  expect((await getModelsForPreset(options)).models).toEqual(['grok-account-a'])
  expect((await getModelsForPreset(options)).source).toBe('cache')
  expect(requests).toBe(1)
  const changed = {
    ...options,
    getGrokCredentials: async () => ({
      ...credentials,
      accessToken: 'other-account',
    }),
  }
  expect((await getModelsForPreset(changed)).models).toEqual(['grok-account-b'])
  expect(requests).toBe(2)
  expect(clearCachedModels(options)).toBe(true)
  const offline = await getModelsForPreset({
    ...options,
    getGrokCredentials: async () => null,
  })
  expect(offline.warning).toContain('/providers:add grok')
  expect(offline.models).toContain('grok-4.6')
  expect(requests).toBe(2)
  expect(
    fs.readFileSync(process.env.CODEBUFF_MODELS_CACHE_PATH!, 'utf8'),
  ).not.toContain('secret')
})
