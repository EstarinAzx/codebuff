import { afterEach, beforeEach, describe, expect, test } from 'bun:test'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'

import { toOpenAIModelId } from '@codebuff/common/constants/chatgpt-oauth'
import { getActiveByokProfile, setActiveByokProfile } from '@codebuff/sdk'

import { clearCachedModels, getModelsForPreset } from '../providers-models'
import { addProfile, getActiveProfile } from '../providers'
import {
  handleModelCommand,
  handleProvidersRefreshModels,
} from '../../commands/providers'

let directory: string
let cachePath: string
let previousProvidersPath: string | undefined
let previousCachePath: string | undefined
const token = `header.${Buffer.from(
  JSON.stringify({
    'https://api.openai.com/auth': { chatgpt_account_id: 'test-account' },
  }),
).toString('base64url')}.signature`
const credentials = {
  accessToken: token,
  refreshToken: 'test-refresh-secret',
  connectedAt: 1,
  expiresAt: Date.now() + 3_600_000,
}
const visible = (slug: string, priority = 1) => ({
  slug,
  visibility: 'list',
  priority,
  supported_in_api: true,
})

beforeEach(() => {
  directory = fs.mkdtempSync(path.join(os.tmpdir(), 'codex-models-'))
  cachePath = path.join(directory, 'models.json')
  previousProvidersPath = process.env.CODEBUFF_PROVIDERS_PATH
  previousCachePath = process.env.CODEBUFF_MODELS_CACHE_PATH
  process.env.CODEBUFF_PROVIDERS_PATH = path.join(directory, 'providers.json')
  process.env.CODEBUFF_MODELS_CACHE_PATH = cachePath
})
afterEach(() => {
  if (previousProvidersPath === undefined)
    delete process.env.CODEBUFF_PROVIDERS_PATH
  else process.env.CODEBUFF_PROVIDERS_PATH = previousProvidersPath
  if (previousCachePath === undefined)
    delete process.env.CODEBUFF_MODELS_CACHE_PATH
  else process.env.CODEBUFF_MODELS_CACHE_PATH = previousCachePath
  fs.rmSync(directory, { recursive: true, force: true })
})

function options(fetchImpl: typeof fetch) {
  return {
    preset: 'codex' as const,
    // OAuth must go only to the fixed official endpoint, even with a bad profile URL.
    baseUrl: 'https://untrusted.example/v1',
    apiKey: '',
    oauthProfileId: 'profile-a',
    filePath: cachePath,
    getCodexCredentials: async () => credentials,
    fetchImpl,
  }
}

describe('Codex OAuth model discovery', () => {
  test('discovers ordered visible models with profile auth and routable future IDs', async () => {
    let requestedUrl = ''
    let request: RequestInit | undefined
    const result = await getModelsForPreset(
      options((async (url: RequestInfo | URL, init?: RequestInit) => {
        requestedUrl = String(url)
        request = init
        return Response.json({
          models: [
            visible('gpt-future-release', 3),
            { ...visible('gpt-5.3-codex-spark', 2), supported_in_api: false },
            visible('gpt-6-astra', 1),
            visible('gpt-6-astra', 1),
            { ...visible('internal-model'), visibility: 'hide' },
            { ...visible('not-listed'), visibility: 'none' },
            visible('../invalid'),
            null,
          ],
        })
      }) as unknown as typeof fetch),
    )

    expect(requestedUrl).toBe(
      'https://chatgpt.com/backend-api/codex/models?client_version=0.153.4',
    )
    const headers = new Headers(request?.headers)
    expect(headers.get('authorization')).toBe(`Bearer ${token}`)
    expect(headers.get('chatgpt-account-id')).toBe('test-account')
    expect(request?.redirect).toBe('error')
    expect(request?.signal).toBeInstanceOf(AbortSignal)
    expect(result.source).toBe('probe')
    expect(result.models).toEqual([
      'gpt-6-astra',
      'gpt-5.3-codex-spark',
      'gpt-future-release',
    ])
    expect(result.models.map(toOpenAIModelId)).toEqual([
      'gpt-6-astra',
      'gpt-5.3-codex-spark',
      'gpt-future-release',
    ])
    expect(fs.readFileSync(cachePath, 'utf8')).not.toContain(token)
    expect(fs.readFileSync(cachePath, 'utf8')).not.toContain(
      credentials.refreshToken,
    )
  })

  test('refreshes after five minutes and isolates profiles and replacement credentials', async () => {
    let calls = 0
    const params = options((async () =>
      Response.json({
        models: [visible(`model-${++calls}`)],
      })) as unknown as typeof fetch)
    const now = Date.now()
    expect((await getModelsForPreset({ ...params, now })).models).toEqual([
      'model-1',
    ])
    expect((await getModelsForPreset({ ...params, now: now + 1 })).source).toBe(
      'cache',
    )
    expect(calls).toBe(1)
    expect(
      (
        await getModelsForPreset({
          ...params,
          forceRefresh: true,
          now: now + 2,
        })
      ).models,
    ).toEqual(['model-2'])
    expect(
      (await getModelsForPreset({ ...params, now: now + 300_003 })).models,
    ).toEqual(['model-3'])
    expect(
      (await getModelsForPreset({ ...params, oauthProfileId: 'profile-b' }))
        .models,
    ).toEqual(['model-4'])
    expect(
      (
        await getModelsForPreset({
          ...params,
          getCodexCredentials: async () => ({
            ...credentials,
            accessToken: 'replacement-token',
          }),
        })
      ).models,
    ).toEqual(['model-5'])
    expect(
      clearCachedModels({
        preset: 'codex',
        baseUrl: params.baseUrl,
        oauthProfileId: 'profile-a',
        filePath: cachePath,
      }),
    ).toBe(true)
    expect(
      (await getModelsForPreset({ ...params, oauthProfileId: 'profile-b' }))
        .models,
    ).toEqual(['model-4'])
    expect((await getModelsForPreset(params)).models).toEqual(['model-6'])
  })

  test('keeps same-profile stale models when the service is unavailable', async () => {
    const params = options((async () =>
      Response.json({
        models: [visible('gpt-6-astra')],
      })) as unknown as typeof fetch)
    await getModelsForPreset(params)
    const result = await getModelsForPreset({
      ...params,
      forceRefresh: true,
      fetchImpl: (async () =>
        new Response('unavailable', {
          status: 503,
        })) as unknown as typeof fetch,
    })
    expect(result.models).toEqual(['gpt-6-astra'])
    expect(result.source).toBe('stale-cache')
    expect(result.warning).toBeTruthy()
  })

  test.each([
    null,
    { models: [] },
    { models: [{ slug: 'hidden', visibility: 'hide' }] },
  ])(
    'labels bundled fallback when the catalog has no usable models: %j',
    async (body) => {
      const result = await getModelsForPreset(
        options((async () => Response.json(body)) as unknown as typeof fetch),
      )
      expect(result.source).toBe('catalog')
      expect(result.models).toContain('gpt-6-astra')
      expect(result.warning).toBeTruthy()
    },
  )

  test('missing OAuth credentials use a labeled fallback without a request', async () => {
    let called = false
    const result = await getModelsForPreset({
      ...options((async () => {
        called = true
        return Response.json({ models: [] })
      }) as unknown as typeof fetch),
      getCodexCredentials: async () => null,
    })
    expect(called).toBe(false)
    expect(result.models).toContain('gpt-6-astra')
    expect(result.warning).toContain('/providers:add codex')
  })

  test('/model uses the linked OAuth profile, refresh clears its cache, and selection reaches the SDK', async () => {
    const previousProfile = getActiveByokProfile()
    const profile = addProfile({
      preset: 'codex',
      name: 'Test Codex',
      apiKey: '',
      model: 'gpt-5.5',
      oauthProfileId: 'linked-oauth',
    })
    let calls = 0
    const lookup = async (params: Parameters<typeof getModelsForPreset>[0]) => {
      expect(params.oauthProfileId).toBe('linked-oauth')
      return getModelsForPreset({
        ...params,
        getCodexCredentials: async () => credentials,
        fetchImpl: (async () => {
          calls++
          return Response.json({ models: [visible('gpt-future-release')] })
        }) as unknown as typeof fetch,
      })
    }
    try {
      expect(await handleModelCommand('', lookup)).toContain(
        'gpt-future-release',
      )
      expect(getActiveProfile()?.model).toBe('gpt-5.5')
      expect(handleProvidersRefreshModels()).toContain('Cleared models cache')
      expect(await handleModelCommand('', lookup)).toContain(
        'live Codex account catalog',
      )
      expect(calls).toBe(2)
      await handleModelCommand('gpt-future-release')
      expect(getActiveProfile()?.id).toBe(profile.id)
      expect(getActiveByokProfile()?.model).toBe('gpt-future-release')
    } finally {
      setActiveByokProfile(previousProfile)
    }
  })
})
