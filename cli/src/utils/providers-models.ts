/**
 * Model id sources per provider preset:
 *   - hardcoded `MODEL_CATALOG` (curated, stable lists — Anthropic, OpenAI, etc.)
 *   - live `/v1/models` probe (churning catalogs — OpenRouter, Together, Groq)
 *   - free-text input (custom-openai)
 *
 * Live probe results land in `<configDir>/models-cache.json`: 5 minutes for
 * account-scoped Codex discovery, 24 hours for generic providers.
 * Cache busted by `/providers:refresh-models`.
 *
 * Consumed by `/providers:add` step 4 model picker and `/model` runtime swap.
 */

import fs from 'fs'
import os from 'os'
import path from 'path'
import { createHash } from 'node:crypto'

import {
  CHATGPT_BACKEND_BASE_URL,
  CODEX_CLIENT_VERSION,
  OPENROUTER_TO_OPENAI_MODEL_MAP,
} from '@codebuff/common/constants/chatgpt-oauth'
import {
  extractChatGptAccountId,
  getValidCodexCredentials,
} from '@codebuff/sdk'

import type { ProviderPreset } from './providers'

const CACHE_TTL_MS = 24 * 60 * 60 * 1000
const CODEX_CACHE_TTL_MS = 5 * 60 * 1000

export const MODEL_CATALOG: Record<ProviderPreset, string[]> = {
  openai: ['gpt-5.1', 'gpt-5.1-chat', 'gpt-4.1', 'gpt-4o', 'o3', 'o4-mini'],
  anthropic: ['claude-sonnet-4.5', 'claude-opus-4.1', 'claude-3.5-haiku'],
  opencode: ['opencode/minimax-m2.7', 'opencode/kimi-k2.6'],
  deepseek: ['deepseek-chat', 'deepseek-reasoner'],
  gemini: ['gemini-2.5-pro', 'gemini-2.5-flash', 'gemini-2.0-flash'],
  mistral: ['mistral-large-latest', 'codestral-latest', 'devstral-latest'],
  // Empty → triggers live /models probe
  openrouter: [],
  together: [],
  groq: [],
  // opencode.ai/zen/go/v1 serves a churning 15+ model list via /models —
  // probe it instead of a stale hardcoded id. Probe returns raw ids
  // (e.g. `glm-5`), which is what Path C dispatch must send to the endpoint.
  'opencode-go': [],
  // Offline fallback only. Live slugs are bare IDs, which Path C routes directly.
  codex: Object.values(OPENROUTER_TO_OPENAI_MODEL_MAP),
  // Empty + special-cased → free-text input
  'custom-openai': [],
}

export type ModelSource =
  'catalog' | 'probe' | 'cache' | 'stale-cache' | 'freetext'

export type ModelLookupResult = {
  source: ModelSource
  models: string[]
  warning?: string
}

// ── path resolution ──────────────────────────────────────────────────────

function getDefaultConfigDir(): string {
  const envSuffix = process.env.NEXT_PUBLIC_CB_ENVIRONMENT
  const dirName =
    envSuffix && envSuffix !== 'prod' ? `manicode-${envSuffix}` : 'manicode'
  return path.join(os.homedir(), '.config', dirName)
}

export function getModelsCachePath(): string {
  return (
    process.env.CODEBUFF_MODELS_CACHE_PATH ??
    path.join(getDefaultConfigDir(), 'models-cache.json')
  )
}

// ── cache I/O ────────────────────────────────────────────────────────────

type CacheEntry = { fetchedAt: number; models: string[] }
type CacheFile = Record<string, CacheEntry>

function cacheKey(preset: ProviderPreset, baseUrl: string): string {
  return `${preset}:${baseUrl.replace(/\/+$/, '')}`
}

function codexCachePrefix(profileId: string): string {
  return `codex-profile:${encodeURIComponent(profileId)}:`
}

function readCacheFile(filePath: string): CacheFile {
  if (!fs.existsSync(filePath)) return {}
  try {
    const raw = fs.readFileSync(filePath, 'utf8')
    const parsed = JSON.parse(raw)
    if (!parsed || typeof parsed !== 'object') return {}
    const out: CacheFile = {}
    for (const [k, v] of Object.entries(parsed as Record<string, unknown>)) {
      if (!v || typeof v !== 'object') continue
      const entry = v as Record<string, unknown>
      const fetchedAt =
        typeof entry.fetchedAt === 'number' ? entry.fetchedAt : NaN
      const models = Array.isArray(entry.models)
        ? entry.models.filter((m): m is string => typeof m === 'string')
        : null
      if (!Number.isFinite(fetchedAt) || !models) continue
      out[k] = { fetchedAt, models }
    }
    return out
  } catch {
    return {}
  }
}

function writeCacheFile(filePath: string, file: CacheFile): void {
  const dir = path.dirname(filePath)
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true, mode: 0o700 })
  }
  const tmp = `${filePath}.${process.pid}.${Date.now()}.tmp`
  fs.writeFileSync(tmp, JSON.stringify(file, null, 2), { mode: 0o600 })
  try {
    fs.renameSync(tmp, filePath)
  } catch (err) {
    try {
      fs.unlinkSync(tmp)
    } catch {
      /* ignore */
    }
    throw err
  }
}

export function readCachedModels(params: {
  preset: ProviderPreset
  baseUrl: string
  filePath?: string
}): CacheEntry | null {
  const filePath = params.filePath ?? getModelsCachePath()
  const file = readCacheFile(filePath)
  return file[cacheKey(params.preset, params.baseUrl)] ?? null
}

export function writeCachedModels(params: {
  preset: ProviderPreset
  baseUrl: string
  models: string[]
  filePath?: string
}): void {
  const filePath = params.filePath ?? getModelsCachePath()
  const file = readCacheFile(filePath)
  file[cacheKey(params.preset, params.baseUrl)] = {
    fetchedAt: Date.now(),
    models: params.models,
  }
  writeCacheFile(filePath, file)
}

export function clearCachedModels(params: {
  preset: ProviderPreset
  baseUrl: string
  oauthProfileId?: string
  filePath?: string
}): boolean {
  const filePath = params.filePath ?? getModelsCachePath()
  const file = readCacheFile(filePath)
  const keys =
    params.preset === 'codex'
      ? Object.keys(file).filter(
          (key) =>
            params.oauthProfileId &&
            key.startsWith(codexCachePrefix(params.oauthProfileId)),
        )
      : [cacheKey(params.preset, params.baseUrl)].filter((key) => key in file)
  if (keys.length === 0) return false
  for (const key of keys) delete file[key]
  writeCacheFile(filePath, file)
  return true
}

export function clearAllCachedModels(filePath?: string): void {
  const resolved = filePath ?? getModelsCachePath()
  writeCacheFile(resolved, {})
}

export function isCacheFresh(
  entry: CacheEntry,
  now: number = Date.now(),
  ttl = CACHE_TTL_MS,
): boolean {
  return now >= entry.fetchedAt && now - entry.fetchedAt < ttl
}

// ── live probe ───────────────────────────────────────────────────────────

/**
 * GET `<baseUrl>/models` with bearer auth, return the model id list.
 * Assumes OpenAI-compat shape: `{ data: [{ id: string, ... }, ...] }`.
 * Throws on non-2xx or malformed payload.
 */
export async function fetchModelsFromEndpoint(params: {
  baseUrl: string
  apiKey: string
  fetchImpl?: typeof globalThis.fetch
}): Promise<string[]> {
  const baseUrl = params.baseUrl.replace(/\/+$/, '')
  const url = `${baseUrl}/models`
  const fetchFn = params.fetchImpl ?? globalThis.fetch
  const res = await fetchFn(url, {
    headers: {
      Authorization: `Bearer ${params.apiKey}`,
      Accept: 'application/json',
    },
  })
  if (!res.ok) {
    throw new Error(`/models probe failed: ${res.status}`)
  }
  const json = (await res.json()) as { data?: Array<{ id?: unknown }> }
  if (!json || !Array.isArray(json.data)) {
    throw new Error('/models probe returned unexpected shape (no `data` array)')
  }
  return json.data
    .map((m) => (typeof m.id === 'string' ? m.id : ''))
    .filter((id) => id.length > 0)
}

// ── orchestrator ─────────────────────────────────────────────────────────

async function fetchCodexModels(
  accessToken: string,
  fetchFn: typeof fetch,
): Promise<string[]> {
  const accountId = extractChatGptAccountId(accessToken)
  const response = await fetchFn(
    `${CHATGPT_BACKEND_BASE_URL}/codex/models?client_version=${CODEX_CLIENT_VERSION}`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: 'application/json',
        originator: 'codex_cli_rs',
        'User-Agent': `codex_cli_rs/${CODEX_CLIENT_VERSION}`,
        ...(accountId ? { 'ChatGPT-Account-ID': accountId } : {}),
      },
      signal: AbortSignal.timeout(5_000),
      redirect: 'error',
    },
  )
  if (!response.ok)
    throw new Error(`Codex model lookup failed (${response.status})`)
  const body = (await response.json()) as { models?: unknown } | null
  if (!body || !Array.isArray(body.models))
    throw new Error('Invalid Codex model catalog')
  const entries: { slug: string; priority: number }[] = []
  for (const model of body.models) {
    if (
      !model ||
      typeof model !== 'object' ||
      model.visibility !== 'list' ||
      typeof model.slug !== 'string' ||
      !/^[a-zA-Z0-9][a-zA-Z0-9._-]*$/.test(model.slug)
    )
      continue
    // supported_in_api is for API-key clients; subscription-only models stay visible.
    entries.push({
      slug: model.slug,
      priority:
        typeof model.priority === 'number' && Number.isFinite(model.priority)
          ? model.priority
          : Number.MAX_SAFE_INTEGER,
    })
  }
  const models = [
    ...new Set(
      entries
        .sort((a, b) => a.priority - b.priority)
        .map((entry) => entry.slug),
    ),
  ]
  if (!models.length)
    throw new Error('Codex catalog contains no visible models')
  return models
}

export async function getModelsForPreset(params: {
  preset: ProviderPreset
  baseUrl: string
  apiKey: string
  oauthProfileId?: string
  getCodexCredentials?: typeof getValidCodexCredentials
  forceRefresh?: boolean
  filePath?: string
  fetchImpl?: typeof globalThis.fetch
  now?: number
}): Promise<ModelLookupResult> {
  const { preset, baseUrl, apiKey, forceRefresh, filePath, fetchImpl, now } =
    params

  if (preset === 'codex') {
    let cached: CacheEntry | undefined
    let authenticated = false
    try {
      const credentials = params.oauthProfileId
        ? await (params.getCodexCredentials ?? getValidCodexCredentials)(
            params.oauthProfileId,
          )
        : null
      if (!credentials) throw new Error('Codex sign-in required')
      authenticated = true
      // Hashing the token isolates replacement accounts and rotations without storing secrets.
      const key = `${codexCachePrefix(params.oauthProfileId!)}${CODEX_CLIENT_VERSION}:${createHash(
        'sha256',
      )
        .update(credentials.accessToken)
        .digest('hex')}`
      const cachePath = filePath ?? getModelsCachePath()
      cached = readCacheFile(cachePath)[key]
      if (
        !forceRefresh &&
        cached &&
        isCacheFresh(cached, now, CODEX_CACHE_TTL_MS)
      ) {
        return { source: 'cache', models: cached.models }
      }
      const models = await fetchCodexModels(
        credentials.accessToken,
        fetchImpl ?? globalThis.fetch,
      )
      try {
        const file = readCacheFile(cachePath)
        // Retain only this profile's current identity/version, preserving other profiles.
        for (const oldKey of Object.keys(file)) {
          if (oldKey.startsWith(codexCachePrefix(params.oauthProfileId!)))
            delete file[oldKey]
        }
        file[key] = { fetchedAt: now ?? Date.now(), models }
        writeCacheFile(cachePath, file)
      } catch {
        // A read-only cache directory must not discard a successful live catalog.
      }
      return { source: 'probe', models }
    } catch {
      return {
        source: cached?.models.length ? 'stale-cache' : 'catalog',
        models: cached?.models.length ? cached.models : MODEL_CATALOG.codex,
        warning: authenticated
          ? 'Could not refresh Codex models. Showing an offline fallback; check your connection or sign-in.'
          : 'Codex sign-in is missing or expired. Showing bundled models; reconnect with /providers:add codex.',
      }
    }
  }

  // Catalog wins when populated — avoids unnecessary network even if user has a key.
  const catalog = MODEL_CATALOG[preset]
  if (catalog.length > 0) return { source: 'catalog', models: catalog }

  if (preset === 'custom-openai') return { source: 'freetext', models: [] }

  // Live probe, cache-first
  if (!forceRefresh) {
    const cached = readCachedModels({ preset, baseUrl, filePath })
    if (cached && isCacheFresh(cached, now)) {
      return { source: 'cache', models: cached.models }
    }
  }

  const models = await fetchModelsFromEndpoint({ baseUrl, apiKey, fetchImpl })
  writeCachedModels({ preset, baseUrl, models, filePath })
  return { source: 'probe', models }
}
