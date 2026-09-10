---
type: flows
project: RD-X-96
updated: 2026-09-11
tags: [flows]
---

# Flows

## Web search and local MCP tools

- **Question:** Can RD-X-96 use existing subscriptions for search and add browser/Windows control without another API key? **Lens:** change.
- **Summary:** Search is a runtime tool with a BYOK facade and availability gate; browser/desktop tools can enter through the existing MCP client and base-agent configuration.
- **Entry:** `packages/agent-runtime/src/tools/handlers/tool/web-search.ts:13`; `cli/src/utils/local-agent-registry.ts:365`.
- **Key files:** `packages/agent-runtime/src/llm-api/codebuff-web-api.ts`, `packages/agent-runtime/src/llm-api/fork-impls/byok-web-tools.ts`, `sdk/src/impl/agent-runtime.ts`, `common/src/mcp/client.ts`, `sdk/src/agents/load-mcp-config.ts`.
- **Updated:** 2026-09-11; records the entry points before this feature's implementation. Consult the implementation plan and current code for added behavior.
