# Web search SDK options for RD-X-96

Researched: 2026-09-11. Scope: search and browser/computer capabilities without another API key, while retaining the user's Grok subscription as the main model. This is research and a recommendation, not a tested implementation or a settled architecture decision.

**Recommendation:** use the existing Codex subscription for a bounded search operation and return its sourced results to RD-X-96's current model. Codex's documented runtime is the strongest supported starting point. Importing either vendor's ordinary API SDK does not turn subscription credentials into general API access. Browser interaction needs a separate browser tool connection.

## Local evidence

RD-X-96 is a Bun/TypeScript terminal agent: `cli/` owns the interface, `sdk/` selects providers, and `packages/agent-runtime/` dispatches tools. See [README](../../README.md).

- [search-providers.ts](../../packages/agent-runtime/src/llm-api/fork-impls/search-providers.ts) already implements `searchWithFallback` for Serper, Brave, and Tavily. [byok-web-tools.ts](../../packages/agent-runtime/src/llm-api/fork-impls/byok-web-tools.ts) hides `web_search` when none of those keys is configured. That gate currently knows nothing about subscription search.
- [model-provider.ts](../../sdk/src/impl/model-provider.ts) already routes Codex OAuth through `https://chatgpt.com/backend-api/codex/responses`. [chatgpt-backend-fetch.ts](../../sdk/src/impl/chatgpt-backend-fetch.ts) converts chat messages and function tools to Responses format; it does not add hosted search automatically.
- The dependency manifests and lockfile contain `@ai-sdk/anthropic` 2.0.50, not the official OpenAI API SDK, Codex SDK, Anthropic Client SDK, or Claude Agent SDK. The installed global Codex CLI README separately documents subscription sign-in. Installing another SDK is therefore an integration choice, not a missing import that enables search.

The assigning agent separately verified that Grok is the active profile, a Codex subscription profile exists, and `SERPER_API_KEY` is present in this environment. No key value, credential store, or live quota was inspected for this research. Missing search credentials must not be asserted as this user's diagnosis.

## What the official products provide

| Route | Documented capability | Authentication and relevance |
| --- | --- | --- |
| OpenAI API SDK (`openai`) | Responses requests can include `{ type: "web_search" }`; output includes search events and citations. | Uses an OpenAI Platform API key. Avoids a separate search-vendor key only if the user already uses API billing. Current search pricing is $10 per 1,000 calls plus search-content and model tokens. [Web search](https://developers.openai.com/api/docs/guides/tools-web-search), [pricing](https://developers.openai.com/api/docs/pricing#built-in-tools). |
| Codex SDK / CLI | The SDK controls a local Codex agent. Local Codex has a hosted search tool, cached by default; `web_search = "live"` enables live search. | Codex supports ChatGPT subscription sign-in and separate usage-based API-key sign-in. Subscription work consumes its plan allowance; it is not unlimited free API access. [SDK](https://learn.chatgpt.com/docs/codex-sdk), [search](https://learn.chatgpt.com/docs/web-search), [authentication](https://learn.chatgpt.com/docs/auth). |
| Anthropic Client SDK | Claude API requests can use a hosted web-search tool; Anthropic performs the search and returns cited content. | Requires Claude API access, not a search-vendor key. Search is $10 per 1,000 searches plus standard token costs. [Claude API web search](https://platform.claude.com/docs/en/agents-and-tools/tool-use/web-search-tool). |
| Claude Agent SDK | Provides Claude Code's agent loop, built-in tools, web search, and MCP integration. | Its overview directs developers to API-key authentication. It says third-party developers cannot offer claude.ai login or rate limits in their products without prior approval. This does not satisfy the requested subscription-reuse route by default. [Agent SDK overview](https://code.claude.com/docs/en/agent-sdk/overview). |

These are capability and documented authentication distinctions, not conclusions about the licensing of unrelated source files.

## Reusing the existing Codex login

**Documented:** Codex CLI and its SDK use a local Codex runtime. A Codex-managed cached login can be reused by that runtime. RD-X-96's own per-profile OAuth store is separate; merely spawning the CLI does not establish that it selects the same account. [Authentication](https://learn.chatgpt.com/docs/auth), [local credential handling](../../sdk/src/codex-credentials.ts).

**Documented, experimental:** Codex App Server exposes `account/login/start` with `type: "chatgptAuthTokens"` for host applications that already manage the user's ChatGPT authentication. The host supplies `accessToken`, `chatgptAccountId`, and optionally `chatgptPlanType`, and handles `account/chatgptAuthTokens/refresh`. This is an explicit interface for connecting an existing login to the Codex runtime. [App Server authentication](https://learn.chatgpt.com/docs/app-server#auth-endpoints).

**Inference:** a narrow Codex search helper can serve results to Grok while leaving Grok selected. With a matching Codex-managed login, a CLI/SDK subprocess has the simpler integration surface. To use RD-X-96's existing profile directly, the App Server external-token interface deserves evaluation; it adds protocol and token-refresh handling and is experimental.

**Subsequent local probe by the implementing agent:** the saved RD-X-96 Codex profile successfully executed hosted search through the existing `/codex/responses` endpoint. The request returned HTTP 200, search-completed events, citation annotation events and a completed response. This supports extending the existing transport for the tested account/model; the public Responses API guide alone does not establish universal subscription-backend parity. Source extraction, cancellation and failure behavior remain implementation verification requirements. This probe was separate from the documentation-only research above.

Custom-provider search is not automatic. Codex documents an optional `supports_standalone_web_search` capability, but explicitly says standalone search is under development, off by default, and dependent on the provider, model, and runtime. This is not evidence that RD-X-96's Grok subscription transport supports it. [Codex web search](https://learn.chatgpt.com/docs/web-search).

## Browser and computer control

OpenAI's API computer-use guide requires the application to provide the browser/desktop environment, execute actions or generated scripts, preserve session state, and return observations such as screenshots. It explicitly supports keeping an existing function-tool or MCP interface. An API SDK alone supplies neither a browser nor a desktop controller. [API computer use](https://developers.openai.com/api/docs/guides/tools-computer-use).

OpenAI separately documents Computer Use as a ChatGPT desktop-app plugin for supported regions on macOS and Windows. Windows uses the active desktop. The page does not document exporting that desktop plugin as an automatic Codex SDK capability. Do not promise full desktop control merely because Codex search works. [Desktop Computer Use](https://learn.chatgpt.com/docs/computer-use).

**Recommendation:** first expose the existing supported MCP browser connection to RD-X-96, with its actual tool permissions and image/result handling. That can support browsing, clicking, forms, and UI verification without buying another search key. Full desktop automation is a separate integration. The parent is tracing the available browser connection; this note does not claim that it already works in RD-X-96.

## Implementation boundary

Keep `web_search` as RD-X-96's stable tool entry point. Add subscription-backed availability and dispatch at the existing facade/gate, preserve configured Serper/Brave/Tavily fallback, and return source URLs with the search result. Account selection, failure reporting, cancellation, and subscription usage must remain explicit. Do not change the main Grok profile or global Codex settings to make search work.

Verification was limited to current official documentation, local source/manifests, and the installed Codex README. No code, authentication, settings, packages, or provider quotas were changed or exercised.
