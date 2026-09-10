# RD-X-96 web and computer tools implementation plan

Date: 2026-09-11

**Goal:** Add sourced web search, browser control and Windows app control without another service API key.

**Spec:** `epics/534ebcad-526b-42d9-a142-dfd98ca72ffd/artifacts/rdx-web-computer-tools/index.md` in the current Traycer epic. The user explicitly selected all three capabilities and authorized implementation.

**Architecture:** Keep the existing search tool and inject a Codex subscription search provider across the SDK/runtime boundary. Reuse the existing MCP client for established browser and Windows desktop servers. Preserve Grok as the main model and the existing credential stores.

## Constraints

- No extra service keys, new model subscription, global provider change, or weakened TLS.
- Keep `main` an upstream mirror. Build on the isolated feature branch.
- Keep original notices, package compatibility, and the existing search-provider fallback.
- Search must return source URLs and explicit errors on failed or incomplete searches. Untrusted web content remains evidence, never instructions.
- Local tools need status, setup guidance and an off switch. Preserve user-defined MCP configuration; do not silently replace colliding server names.
- Desktop live checks touch only disposable test windows.
- No public release or global replacement of the shipped 1.5.1 binary in this task.

## Task 1: Subscription web search

Owner: search implementer. Parent owns final integration.

Likely files: SDK `impl/fork-impls/codex-web-search.ts`, `impl/fork-hooks.ts`, `impl/agent-runtime.ts`, `index.ts`; common runtime dependency contract; runtime search facade/handler/template gate and explicit subagent dependency forwarding; CLI `init/init-app.ts`, `commands/providers.ts` and provider selection helper.

Interface: expose `setByokSearchProfile(profile | null)` from the SDK (Codex OAuth profile only). Parent/CLI picks the active Codex profile or the first configured Codex profile, without changing the active model. Pass a typed optional search function in runtime dependencies; capture the selected profile for a run. Search input is `{ query, depth?, signal? }`; output retains `{ result?, error?, creditsUsed? }`. Extend existing types where practical instead of introducing a parallel dispatcher.

- [x] Write meaningful tests for search availability without service keys, provider selection, streamed source extraction, failed/incomplete stream and cancellation.
- [x] Verify the tests fail before the implementation.
- [x] Implement a bounded Responses search call using existing credentials, account header and refresh helper. Request only hosted web search; do not grant shell or filesystem tools.
- [x] Collect text and citation annotation events (completed response output may be empty); require real successful search evidence and completed response before reporting success. Reject malformed/truncated success.
- [x] Wire search availability and dispatch through root and spawned agents. Keep legacy key providers usable when no subscription search is available.
- [x] Verify focused tests and report exact files/checks. Do not commit shared work.

## Task 2: Browser and Windows desktop connectors

Owner: local-tools implementer. Parent owns final integration.

Likely files: CLI `utils/computer-tools.ts`, `commands/computer-tools.ts`, `commands/command-registry.ts`, `data/slash-commands.ts`, `utils/local-agent-registry.ts`, focused tests, and `docs/computer-tools.md`. Avoid Task 1's CLI files.

Interface: add `/browser` and `/computer` commands with `on`, `off`, and status behavior. Read a product-scoped local settings file, not shared Claude/Codex settings. Merge enabled built-in MCP entries into base agents while honoring existing user entries. Document/pin verified upstream server versions. Browser server: evaluate official Playwright MCP. Windows server: evaluate official Windows-MCP. Dependency installation may be lazy, but missing tools and first-run failures must produce actionable errors.

- [x] Verify primary upstream docs/API, executable arguments, supported platforms, image/tool capabilities and license requirements.
- [x] Write meaningful tests for command behavior, platform checks, configuration preservation, idempotence and MCP merge/collision behavior.
- [x] Implement the minimum connector setup/status/off UX and agent-registration integration. Keep commands visible only where supported and explain missing prerequisites without leaking implementation into normal prompts.
- [x] Ensure MCP screenshots arrive as images and arbitrary provider selection still works. Inspect current allowlist and approval paths rather than assuming MCP bypasses them.
- [x] Verify focused tests and exact dependency installation/discovery on this Windows machine using task-owned locations only. Do not drive live pages/desktop; parent handles disposable live checks.
- [x] Report files/checks and concise usage. Do not commit shared work.

Task 2 evidence: `.superpowers/sdd/2026-09-11-web-computer-tools/task-2-report.md`. Managed connectors exclude PLAN; native Windows cold-cache discovery passed with scoped system CA support. Browser setup requires Node 22.15+.

## Task 3: Verification and delivery

Owner: parent.

- [x] Run search and MCP regression tests plus common, SDK and CLI typechecks. Compare any wider pre-existing failure before attributing it to this change.
- [x] Real search must return at least one public source URL through the implemented entry point using the existing saved account.
- [x] Real browser check: discover tools, open a disposable local page, type/click, and read changed state.
- [x] Real desktop check: discover tools, open a disposable task window, type/click and read changed state; close only the task-owned window.
- [x] Independent review of both tasks and their combined behavior; fix material findings and rerun affected checks.
- [x] Build an identifiable development binary, verify help/version and new commands where possible, and give its path. Do not publish or replace the global release.
- [x] Update the work ledger and project handoff with completed behavior, evidence and any remaining limits.
