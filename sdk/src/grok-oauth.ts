import { randomUUID } from 'node:crypto'
import fs from 'node:fs'
import path from 'node:path'
import { setTimeout as delay } from 'node:timers/promises'

import {
  GROK_AUTH_URL,
  GROK_BASE_URL,
  GROK_CLIENT_ID,
  GROK_CLIENT_VERSION,
  grokHeaders,
} from '@codebuff/common/constants/grok'
import { z } from 'zod/v4'

import { getConfigDir } from './credentials'

const secret = z.string().min(1).max(32_768).regex(/^\S+$/)
const credentialsSchema = z.object({
  accessToken: secret,
  refreshToken: secret,
  expiresAt: z.number().finite().nonnegative(),
  connectedAt: z.number().finite().nonnegative(),
})
export type GrokCredentials = z.infer<typeof credentialsSchema>
const storeSchema = z.record(z.string(), credentialsSchema)
const tokenSchema = z.object({
  access_token: secret,
  refresh_token: secret.optional(),
  expires_in: z.number().positive().max(31_536_000),
  token_type: z.string().refine((value) => value.toLowerCase() === 'bearer'),
})
type RequestOptions = { fetchImpl?: typeof fetch; signal?: AbortSignal }

export function getGrokCredentialsPath(): string {
  return (
    process.env.CODEBUFF_GROK_CREDENTIALS_PATH ??
    path.join(getConfigDir(), 'grok-oauth.json')
  )
}

function readStore(filePath: string): Record<string, GrokCredentials> {
  try {
    return storeSchema.parse(JSON.parse(fs.readFileSync(filePath, 'utf8')))
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') return {}
    // Do not overwrite a corrupt store, or echo credential values from validation errors.
    throw new Error(
      'Cannot read Grok credentials file; repair it before signing in again.',
    )
  }
}

function writeStore(
  filePath: string,
  store: Record<string, GrokCredentials>,
): void {
  fs.mkdirSync(path.dirname(filePath), { recursive: true, mode: 0o700 })
  const temporary = `${filePath}.${randomUUID()}.tmp`
  try {
    fs.writeFileSync(temporary, JSON.stringify(store, null, 2), { mode: 0o600 })
    fs.renameSync(temporary, filePath)
  } finally {
    fs.rmSync(temporary, { force: true })
  }
}

export function getGrokCredentials(
  profileId: string,
  filePath = getGrokCredentialsPath(),
): GrokCredentials | null {
  const store = readStore(filePath)
  return Object.hasOwn(store, profileId) ? store[profileId] : null
}

export function saveGrokCredentials(
  profileId: string,
  credentials: GrokCredentials,
  filePath = getGrokCredentialsPath(),
): void {
  const parsed = credentialsSchema.safeParse(credentials)
  if (!profileId || !parsed.success) throw new Error('Invalid Grok credentials')
  writeStore(filePath, { ...readStore(filePath), [profileId]: parsed.data })
}

export function clearGrokCredentials(
  profileId: string,
  filePath = getGrokCredentialsPath(),
): boolean {
  const store = readStore(filePath)
  if (!Object.hasOwn(store, profileId)) return false
  delete store[profileId]
  writeStore(filePath, store)
  return true
}

async function readJson(response: Response, limit = 65_536): Promise<unknown> {
  if (!response.body) throw new Error('Empty Grok response')
  const reader = response.body.getReader()
  const chunks: Uint8Array[] = []
  let size = 0
  try {
    for (;;) {
      const { done, value } = await reader.read()
      if (done) break
      size += value.byteLength
      if (size > limit) {
        void reader.cancel().catch(() => {})
        throw new Error('Grok response exceeds the size limit')
      }
      chunks.push(value)
    }
    try {
      return JSON.parse(Buffer.concat(chunks).toString('utf8'))
    } catch {
      throw new Error('Invalid JSON from Grok')
    }
  } finally {
    reader.releaseLock()
  }
}

async function authRequest(
  endpoint: 'device/code' | 'token',
  body: Record<string, string>,
  options: RequestOptions,
) {
  const response = await (options.fetchImpl ?? globalThis.fetch)(
    `${GROK_AUTH_URL}/oauth2/${endpoint}`,
    {
      method: 'POST',
      redirect: 'error',
      signal: AbortSignal.any([
        AbortSignal.timeout(5_000),
        ...(options.signal ? [options.signal] : []),
      ]),
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'x-grok-client-version': GROK_CLIENT_VERSION,
        'x-grok-client-surface': 'cli',
      },
      body: new URLSearchParams({ client_id: GROK_CLIENT_ID, ...body }),
    },
  )
  return { response, data: await readJson(response) }
}

function shapeToken(
  data: unknown,
  previous?: GrokCredentials,
): GrokCredentials {
  const result = tokenSchema.safeParse(data)
  if (!result.success) throw new Error('Invalid Grok token response')
  const refreshToken = result.data.refresh_token ?? previous?.refreshToken
  if (!refreshToken) throw new Error('Grok did not return a refresh token')
  // OAuth access tokens are opaque. We neither store nor use OIDC identity claims.
  return {
    accessToken: result.data.access_token,
    refreshToken,
    expiresAt: Date.now() + result.data.expires_in * 1000,
    connectedAt: previous?.connectedAt ?? Date.now(),
  }
}

const verificationUri = z
  .string()
  .url()
  .refine((value) => {
    const url = new URL(value)
    return (
      [GROK_AUTH_URL, 'https://accounts.x.ai'].includes(url.origin) &&
      !url.username &&
      !url.password
    )
  })
const deviceSchema = z.object({
  device_code: secret,
  user_code: z
    .string()
    .min(1)
    .max(128)
    .regex(/^[A-Za-z0-9-]+$/),
  verification_uri: verificationUri,
  verification_uri_complete: verificationUri.optional(),
  expires_in: z.number().positive().max(1800),
  interval: z.number().positive().max(60).optional(),
})

export async function startGrokDeviceLogin(options: RequestOptions = {}) {
  options.signal?.throwIfAborted()
  const { response, data } = await authRequest(
    'device/code',
    {
      scope:
        'openid profile email offline_access grok-cli:access api:access conversations:read conversations:write',
      referrer: 'grok-build',
    },
    options,
  )
  if (!response.ok)
    throw new Error(`Grok login could not start (${response.status})`)
  const parsed = deviceSchema.safeParse(data)
  if (!parsed.success)
    throw new Error('Invalid Grok device authorization response')
  const device = parsed.data
  const deadline = Date.now() + device.expires_in * 1000
  return {
    userCode: device.user_code,
    verificationUri:
      device.verification_uri_complete ?? device.verification_uri,
    async waitForCredentials(): Promise<GrokCredentials> {
      const remaining = deadline - Date.now()
      if (remaining <= 0)
        throw new Error(
          'Grok device code expired; run /providers:add grok again.',
        )
      const signal = AbortSignal.any([
        AbortSignal.timeout(Math.ceil(remaining)),
        ...(options.signal ? [options.signal] : []),
      ])
      let interval = Math.max(1, device.interval ?? 5) * 1000
      for (;;) {
        await delay(interval, undefined, { signal })
        const { response, data } = await authRequest(
          'token',
          {
            grant_type: 'urn:ietf:params:oauth:grant-type:device_code',
            device_code: device.device_code,
          },
          { ...options, signal },
        )
        if (response.ok) return shapeToken(data)
        const error = z.object({ error: z.string() }).safeParse(data)
        switch (error.success ? error.data.error : '') {
          case 'authorization_pending':
            break
          case 'slow_down':
            interval += 5000
            break
          case 'access_denied':
            throw new Error('Grok login was denied.')
          case 'expired_token':
            throw new Error(
              'Grok device code expired; run /providers:add grok again.',
            )
          default:
            throw new Error(`Grok token exchange failed (${response.status}).`)
        }
      }
    },
  }
}

const refreshes = new Map<string, Promise<GrokCredentials | null>>()

export async function getValidGrokCredentials(
  profileId: string,
  options: RequestOptions & { filePath?: string } = {},
): Promise<GrokCredentials | null> {
  const filePath = options.filePath ?? getGrokCredentialsPath()
  const credentials = getGrokCredentials(profileId, filePath)
  if (!credentials) return null
  if (credentials.expiresAt > Date.now() + 300_000) return credentials
  const key = JSON.stringify([filePath, profileId])
  const existing = refreshes.get(key)
  if (existing) return existing
  const task = (async () => {
    const { response, data } = await authRequest(
      'token',
      {
        grant_type: 'refresh_token',
        refresh_token: credentials.refreshToken,
      },
      options,
    )
    if (!response.ok)
      throw new Error(
        `Grok token refresh failed (${response.status}); retry or run /providers:add grok.`,
      )
    const next = shapeToken(data, credentials)
    const current = getGrokCredentials(profileId, filePath)
    if (!current || current.refreshToken !== credentials.refreshToken)
      return current
    saveGrokCredentials(profileId, next, filePath)
    return next
  })()
  refreshes.set(key, task)
  try {
    return await task
  } finally {
    refreshes.delete(key)
  }
}

export async function fetchGrokModels(
  accessToken: string,
  fetchImpl: typeof fetch = globalThis.fetch,
): Promise<string[]> {
  const response = await fetchImpl(`${GROK_BASE_URL}/models`, {
    headers: grokHeaders(accessToken),
    redirect: 'error',
    signal: AbortSignal.timeout(5_000),
  })
  if (!response.ok)
    throw new Error(`Grok model lookup failed (${response.status})`)
  const body = await readJson(response, 2_000_000)
  const parsed = z
    .object({
      models: z.array(z.unknown()).optional(),
      data: z.array(z.unknown()).optional(),
    })
    .safeParse(body)
  const rows = parsed.success ? (parsed.data.models ?? parsed.data.data) : null
  if (!rows) throw new Error('Invalid Grok model catalog')
  const models = [
    ...new Set(
      rows.flatMap((row) => {
        const result = z
          .object({ id: z.string().regex(/^[a-zA-Z0-9][a-zA-Z0-9._-]*$/) })
          .safeParse(row)
        return result.success ? [result.data.id] : []
      }),
    ),
  ]
  if (!models.length) throw new Error('Grok catalog contains no models')
  return models
}
