/**
 * Model provider abstraction for routing requests to the appropriate LLM provider.
 *
 * Dispatch order:
 * - Fork Path C (BYOK): hook installed via `registerForkHooks({ resolveByok })`
 *   short-circuits when an active BYOK profile is set. No-op when fork is
 *   absent. Implementation lives in `./fork-impls/byok-resolver.ts`.
 * - Path A (ChatGPT OAuth): direct OpenAI/Codex requests using the user's OAuth token.
 * - Path B (Codebuff backend): requests through codebuff.com (routes to OpenRouter).
 */

import path from 'path'

import {
  FREEBUFF_TURN_SPEND_LIMIT_ERROR_CODE,
  FREEBUFF_TURN_SPEND_LIMIT_MESSAGE,
} from '@codebuff/common/constants/freebuff-errors'
import { FREEBUFF_ACTING_USER_HEADER } from '@codebuff/common/constants/freebuff-models'
import { isTransientNetworkError } from '@codebuff/common/util/error'

import { BYOK_OPENROUTER_HEADER } from '@codebuff/common/constants/byok'
import { isFreeMode } from '@codebuff/common/constants/free-agents'
import {
  CHATGPT_BACKEND_BASE_URL,
  CHATGPT_OAUTH_ENABLED,
  isChatGptOAuthModelAllowed,
  isOpenAIProviderModel,
  toOpenAIModelId,
} from '@codebuff/common/constants/chatgpt-oauth'
import { SENTINEL_BACKEND_URL } from '@codebuff/common/env-schema'
import {
  OpenAICompatibleChatLanguageModel,
  VERSION,
} from '@codebuff/llm-providers/openai-compatible'
import { APICallError } from 'ai'

import { getWebsiteUrl } from '../constants'
import { getValidChatGptOAuthCredentials } from '../credentials'
import { getByokOpenrouterApiKeyFromEnv } from '../env'
import {
  createChatGptBackendFetch,
  extractChatGptAccountId,
} from './chatgpt-backend-fetch'
import { getForkHooks } from './fork-hooks'

import type { LanguageModel } from 'ai'

// ============================================================================
// ChatGPT OAuth Rate Limit Cache
// ============================================================================

/** Timestamp (ms) when ChatGPT OAuth rate limit expires, or null if not rate-limited */
let chatGptOAuthRateLimitedUntil: number | null = null

/**
 * Mark ChatGPT OAuth as rate-limited. Subsequent requests will skip direct ChatGPT OAuth
 * and use Codebuff backend until the reset time.
 */
export function markChatGptOAuthRateLimited(resetAt?: Date): void {
  const fiveMinutesFromNow = Date.now() + 5 * 60 * 1000
  chatGptOAuthRateLimitedUntil = resetAt
    ? resetAt.getTime()
    : fiveMinutesFromNow
}

/**
 * Check if ChatGPT OAuth is currently rate-limited.
 */
export function isChatGptOAuthRateLimited(): boolean {
  if (chatGptOAuthRateLimitedUntil === null) {
    return false
  }
  if (Date.now() >= chatGptOAuthRateLimitedUntil) {
    chatGptOAuthRateLimitedUntil = null
    return false
  }
  return true
}

/**
 * Reset the ChatGPT OAuth rate-limit cache.
 * Call this when user reconnects their ChatGPT subscription.
 */
export function resetChatGptOAuthRateLimit(): void {
  chatGptOAuthRateLimitedUntil = null
}

/**
 * Parameters for requesting a model.
 */
export interface ModelRequestParams {
  /** Codebuff API key for backend authentication */
  apiKey: string
  /** End user represented by a trusted service-account request. */
  userId?: string
  /** Model ID (OpenRouter format, e.g., "anthropic/claude-sonnet-4") */
  model: string
  /** If true, skip ChatGPT OAuth and use Codebuff backend (for fallback after rate limit) */
  skipChatGptOAuth?: boolean
  /** Cost mode (e.g. 'free') â€” affects fallback behavior for OAuth routes */
  costMode?: string
  /**
   * Optional agent id (e.g. 'file-picker', 'mod-default'). Threaded through
   * so the fork's BYOK hook can per-agent route. Ignored by Path A / Path B.
   */
  agentId?: string
}

/**
 * Result from getModelForRequest.
 */
export interface ModelResult {
  /** The language model to use for requests */
  model: LanguageModel
  /** Whether this model uses ChatGPT OAuth direct (affects cost tracking) */
  isChatGptOAuth: boolean
}

// Usage accounting type for OpenRouter/Codebuff backend responses
type OpenRouterUsageAccounting = {
  cost: number | null
  costDetails: {
    upstreamInferenceCost: number | null
  }
}

/**
 * Notification hook for free-mode capacity deferrals. When the backend sheds
 * a free-mode completion under saturation (HTTP 429 with
 * `error: 'free_mode_capacity_deferred'` â€” see the server's
 * free-mode-priority.ts), the AI SDK's retry loop absorbs the wait silently.
 * Hosts (the CLI) can register here to surface a "high demand" indicator
 * instead of an unexplained pause.
 */
export type FreeModeCapacityDeferral = { retryAfterSeconds: number }

let freeModeCapacityDeferralListener:
  ((deferral: FreeModeCapacityDeferral) => void) | null = null

export function setFreeModeCapacityDeferralListener(
  listener: ((deferral: FreeModeCapacityDeferral) => void) | null,
): void {
  freeModeCapacityDeferralListener = listener
}

function notifyCapacityDeferralFromResponse(response: Response): void {
  if (response.status !== 429 || !freeModeCapacityDeferralListener) return
  // Clone so the AI SDK still reads the original body for its own error
  // handling/retry. Both the parse and the listener are best-effort: a
  // malformed body or throwing listener must never break the request path.
  void response
    .clone()
    .json()
    .then((body: unknown) => {
      const error =
        body && typeof body === 'object' ? (body as any).error : undefined
      if (error !== 'free_mode_capacity_deferred') return
      const retryAfterHeader = Number(response.headers.get('retry-after'))
      freeModeCapacityDeferralListener?.({
        retryAfterSeconds:
          Number.isFinite(retryAfterHeader) && retryAfterHeader > 0
            ? retryAfterHeader
            : 10,
      })
    })
    .catch(() => {})
}

function requestUrlOf(input: Parameters<typeof globalThis.fetch>[0]): string {
  return typeof input === 'string'
    ? input
    : input instanceof URL
      ? input.toString()
      : input.url
}

/**
 * The per-turn spend breaker (HTTP 429, body `{ error: 'turn_spend_limit',
 * message }`) is final for THIS turn: its spend only grows, so the same run
 * id is refused again on every retry. Left to the AI SDK, which treats every
 * 429 as retryable, a capped turn asked four times over ~14s and then failed
 * as "Failed after 4 attempts. Last error: Too Many Requests" â€” which every
 * client read as an ordinary rate limit and answered with "wait a moment or
 * switch models", neither of which helps. Throwing a NON-retryable
 * APICallError stops the retry loop on the first refusal, and carrying the
 * body lets the runtime's error parser hand the server's own copy (and the
 * `turn_spend_limit` code) to the client unchanged.
 */
async function throwIfTurnSpendCapped(
  response: Response,
  url: string,
): Promise<void> {
  if (response.status !== 429) return
  const text = await response
    .clone()
    .text()
    .catch(() => '')
  let body: { error?: unknown; message?: unknown } | null = null
  try {
    body = JSON.parse(text)
  } catch {
    return
  }
  if (body?.error !== FREEBUFF_TURN_SPEND_LIMIT_ERROR_CODE) return
  throw new APICallError({
    message:
      typeof body.message === 'string' && body.message
        ? body.message
        : FREEBUFF_TURN_SPEND_LIMIT_MESSAGE,
    url,
    requestBodyValues: {},
    statusCode: response.status,
    responseBody: text,
    isRetryable: false,
  })
}

/**
 * Wrap global fetch so transient connection failures (socket closed/reset,
 * connection refused) are rethrown as retryable APICallErrors, and a capped
 * turn's 429 as a non-retryable one (see throwIfTurnSpendCapped).
 *
 * Bun's fetch throws these as plain Errors ("The socket connection was closed
 * unexpectedly...", code ECONNRESET/ConnectionClosed), which the AI SDK does
 * not recognize as retryable â€” it only auto-retries APICallError with
 * isRetryable=true. Marking them retryable lets streamText's built-in
 * exponential backoff (default 2 retries) absorb brief server/network blips
 * instead of failing the whole agent run.
 */
function fetchWithRetryableNetworkErrors(
  ...args: Parameters<typeof globalThis.fetch>
): ReturnType<typeof globalThis.fetch> {
  const url = requestUrlOf(args[0])
  return globalThis.fetch(...args).then(
    async (response) => {
      notifyCapacityDeferralFromResponse(response)
      await throwIfTurnSpendCapped(response, url)
      return response
    },
    (error: unknown) => {
      if (isTransientNetworkError(error)) {
        throw new APICallError({
          message: error instanceof Error ? error.message : String(error),
          cause: error,
          url,
          requestBodyValues: {},
          isRetryable: true,
        })
      }
      throw error
    },
  )
}

/**
 * Get the appropriate model for a request.
 *
 * If ChatGPT OAuth credentials are available and the model is an OpenAI model,
 * returns an OpenAI direct model. Otherwise, returns the Codebuff backend model.
 *
 * This function is async because it may need to refresh the OAuth token.
 */
export async function getModelForRequest(
  params: ModelRequestParams,
): Promise<ModelResult> {
  const { apiKey, model, skipChatGptOAuth, costMode } = params

  const forked = await getForkHooks().resolveByok?.(params)
  if (forked) return forked

  // Check if we should use ChatGPT OAuth direct
  // Only attempt for allowlisted models; non-allowlisted models silently fall through to backend.
  if (
    CHATGPT_OAUTH_ENABLED &&
    !skipChatGptOAuth &&
    isOpenAIProviderModel(model) &&
    isChatGptOAuthModelAllowed(model)
  ) {
    // In free mode, rate-limited ChatGPT OAuth must not silently fall through to
    // the Codebuff backend â€” freebuff should only use the direct OpenAI route or fail.
    if (isChatGptOAuthRateLimited()) {
      if (isFreeMode(costMode)) {
        throw new Error(
          'ChatGPT rate limit reached. Please wait a few minutes and try again.',
        )
      }
    } else {
      const chatGptOAuthCredentials = await getValidChatGptOAuthCredentials()

      if (chatGptOAuthCredentials) {
        return {
          model: createOpenAIOAuthModel(
            model,
            chatGptOAuthCredentials.accessToken,
          ),
          isChatGptOAuth: true,
        }
      }

      // In free mode, if credentials are unavailable, don't fall through to backend.
      if (isFreeMode(costMode)) {
        throw new Error(
          'ChatGPT OAuth credentials unavailable. Please reconnect with /connect:chatgpt.',
        )
      }
    }
  }

  // Path B â€” Codebuff backend (legacy). Fail fast when neither a real backend
  // URL is configured nor the explicit opt-in env flag is set, so BYOK users
  // who forgot to register a profile see a clear error instead of confusing
  // 401s against the sentinel URL.
  if (
    getWebsiteUrl() === SENTINEL_BACKEND_URL &&
    process.env.CODEBUFF_USE_BACKEND !== '1'
  ) {
    throw new Error(
      'No active BYOK profile and no Codebuff backend configured. ' +
        'Run /providers:add to register a provider profile, or set ' +
        'NEXT_PUBLIC_CODEBUFF_APP_URL + CODEBUFF_USE_BACKEND=1 to use the ' +
        'legacy Codebuff backend.',
    )
  }

  return {
    model: createCodebuffBackendModel(apiKey, model, params.userId),
    isChatGptOAuth: false,
  }
}

/**
 * Create an OpenAI model that routes through the ChatGPT backend API (Codex endpoint).
 * Uses a custom fetch that transforms between Chat Completions and Responses API formats.
 *
 * Exported so the fork's BYOK Path C-oauth (codex preset) can dispatch through
 * the same ChatGPT-backend code path Path A uses.
 */
// PORT: keep `export` â€” fork-impls/byok-resolver.ts imports this for Path C-oauth dispatch.
export function createOpenAIOAuthModel(
  model: string,
  oauthToken: string,
): LanguageModel {
  const openAIModelId = toOpenAIModelId(model)
  const accountId = extractChatGptAccountId(oauthToken)

  return new OpenAICompatibleChatLanguageModel(openAIModelId, {
    provider: 'openai',
    url: () => `${CHATGPT_BACKEND_BASE_URL}/codex/responses`,
    headers: () => ({
      Authorization: `Bearer ${oauthToken}`,
      'Content-Type': 'application/json',
      'OpenAI-Beta': 'responses=experimental',
      originator: 'codex_cli_rs',
      accept: 'text/event-stream',
      'user-agent': `ai-sdk/openai-compatible/${VERSION}/codebuff-chatgpt-oauth`,
      ...(accountId ? { 'chatgpt-account-id': accountId } : {}),
    }),
    fetch: createChatGptBackendFetch(),
    supportsStructuredOutputs: true,
    includeUsage: undefined,
  })
}

function createCodebuffBackendModel(
  apiKey: string,
  model: string,
  userId?: string,
): LanguageModel {
  const openrouterUsage: OpenRouterUsageAccounting = {
    cost: null,
    costDetails: {
      upstreamInferenceCost: null,
    },
  }

  const openrouterApiKey = getByokOpenrouterApiKeyFromEnv()

  return new OpenAICompatibleChatLanguageModel(model, {
    provider: 'codebuff',
    url: ({ path: endpoint }) =>
      new URL(path.join('/api/v1', endpoint), getWebsiteUrl()).toString(),
    headers: () => ({
      Authorization: `Bearer ${apiKey}`,
      'user-agent': `ai-sdk/openai-compatible/${VERSION}/codebuff`,
      ...(userId ? { [FREEBUFF_ACTING_USER_HEADER]: userId } : {}),
      ...(openrouterApiKey && { [BYOK_OPENROUTER_HEADER]: openrouterApiKey }),
    }),
    metadataExtractor: {
      extractMetadata: async ({ parsedBody }: { parsedBody: any }) => {
        if (openrouterApiKey !== undefined) {
          return { codebuff: { usage: openrouterUsage } }
        }

        if (typeof parsedBody?.usage?.cost === 'number') {
          openrouterUsage.cost = parsedBody.usage.cost
        }
        if (
          typeof parsedBody?.usage?.cost_details?.upstream_inference_cost ===
          'number'
        ) {
          openrouterUsage.costDetails.upstreamInferenceCost =
            parsedBody.usage.cost_details.upstream_inference_cost
        }
        return { codebuff: { usage: openrouterUsage } }
      },
      createStreamExtractor: () => ({
        processChunk: (parsedChunk: any) => {
          if (openrouterApiKey !== undefined) {
            return
          }

          if (typeof parsedChunk?.usage?.cost === 'number') {
            openrouterUsage.cost = parsedChunk.usage.cost
          }
          if (
            typeof parsedChunk?.usage?.cost_details?.upstream_inference_cost ===
            'number'
          ) {
            openrouterUsage.costDetails.upstreamInferenceCost =
              parsedChunk.usage.cost_details.upstream_inference_cost
          }
        },
        buildMetadata: () => {
          return { codebuff: { usage: openrouterUsage } }
        },
      }),
    },
    // Cast: Bun's fetch type also declares a `preconnect` helper, but the AI
    // SDK only ever invokes fetch as a plain function.
    fetch: fetchWithRetryableNetworkErrors as typeof globalThis.fetch,
    includeUsage: undefined,
    supportsStructuredOutputs: true,
  })
}

// ============================================================================
// Fork re-exports â€” BYOK Path C surface lives in ./fork-impls/byok-resolver.
// Kept here so existing import sites (`sdk/src/index.ts`, `database.ts`, tests)
// resolve unchanged. Re-exports are bottom-of-file to keep this region
// upstream-merge-cold.
// ============================================================================

export {
  setActiveByokProfile,
  getActiveByokProfile,
  setByokAgentBindings,
  getByokAgentBindings,
} from './fork-impls/byok-resolver'
export type { BYOKProfile } from './fork-impls/byok-resolver'
