---
type: active-work
project: codebuff (fork ? modded branch)
updated: 2026-09-08
tags: [context, active-work, byok, codex]
---

# Active Work

_Last updated: 2026-09-08 by GPT-6 Astra (auto)_
_Release commit: `f82f41947`, tag `v1.4.0`; source integrated and pushed on `modded`._

## Current focus

Upstream sync and automatic Codex model discovery are implemented, reviewed and installed locally. GitHub release 1.4.0 is public with all three platform archives. npm publishing awaits renewed authentication; registry `latest` remains 1.3.2.

## State

- **Done:** synced upstream snapshot `ab19b7582`, preserving BYOK behavior, fork launcher and agent templates. `main` is `88c4df13a`, a history-preserving bridge with exactly the upstream tree; `modded` includes the new upstream history. Neither branch was force-pushed.
- **Done:** live Codex catalog, profile/credential/version-isolated five-minute cache, bounded refresh and catalog requests, labeled offline fallback, and future bare model IDs. Actual Astra discovery and a tool call followed by visible `CODEX_OAUTH_OK` succeeded using the existing native Codex login.
- **Done:** independent review closed all three findings: legacy OAuth credential preservation, BYOK suppression of sponsored polling, and bounded OAuth refresh. Review artifact lives in this Traycer epic under `artifacts/upstream-integration-review/index.md`.
- **Done:** Windows, Linux x64 and Linux arm64 archives built; each includes executable + `tree-sitter.wasm`. GitHub asset SHA-256 digests match the local archives. Packaged Windows startup and installed `cbm --version` both report 1.4.0. Linux archives were checked for architecture and contents but not executed on Linux.
- **Blocked:** npm `whoami` returns HTTP 401. npm publish dry-run passed (five launcher files, 9.4 kB); a subsequent publish attempt was rejected with E404 while whoami still returned 401. npm 1.4.0 is not published. No browser is connected to the agent runtime, so interactive sign-in needs the user.
- **Authentication:** all three saved Codebuff Codex profiles return 401 on refresh. They were not overwritten with the native Codex account's tokens. Reconnect the desired account using `/providers:add codex`. The active `opencode-go` provider is unchanged.

## Pick up here

1. Complete npm sign-in, verify ownership (`npm whoami`; expected historical publisher `tsd47216`), then run `npm publish` from `cli/release` per [MERGE-STRATEGY](../MERGE-STRATEGY.md). GitHub release/tag/assets already exist; do not recreate them or overwrite the tag.
2. Verify registry-direct `codebuff-mod/latest` is 1.4.0, then update this handoff and [[overview]].
3. For Codex use, run `cbm`, `/providers:add codex`, complete browser OAuth, then `/model`. Newly discovered account models use bare IDs such as `gpt-6-astra`.

## Verification and limits

- Common, SDK and CLI typechecks pass. Targeted checks include provider/store/discovery tests, credential preservation and ad suppression, real SDK 7 OAuth reasoning replay, Anthropic image compatibility, and Context7/read_docs (15 tests).
- Broad Windows suites are NOT fully green. Common: 1616 pass / 25 fail; the same 25 failure names reproduce in upstream (1612 pass). SDK: 517 pass / 92 fail / 15 skip; upstream has 469 pass / 93 fail / 15 skip, with no fork-only failure names.
- Last broad CLI run: 3190 pass / 32 fail / 26 skip, with no loader errors after repairing the missing public-snapshot test helper. One contradictory upstream OAuth-deletion expectation was subsequently corrected; the full credential-storage file passes 21/21. Other failures include Windows paths, unavailable sandbox containment, and upstream expectations conflicting with intentional fork behavior. Targeted feature checks are green.
- Baseline worktree: `C:/Users/S.D/.traycer/worktrees/estarinazx__codebuff-modded/verify-upstream-2026-09-08`. Only test harness/Windows fixture adapters were applied there; production source stays upstream. Preserve it if comparing failures; cleanup is separate.

## Recent context

- The launcher fetches npm's published version. Installing the unpublished 1.4.0 wrapper initially downloaded 1.3.2. The verified 1.4.0 executable/WASM and truthful version metadata were installed in the local cache afterward; `cbm --version` is now 1.4.0. Rollback copies have suffix `.before-1.4.0-001531c455ce4ae2a4c95915c63aa521` in `~/.config/manicode`.
- Package requests on this machine needed `NODE_EXTRA_CA_CERTS=C:/Users/S.D/AppData/Local/Temp/codebuff-windows-trust.pem`, exported from existing Windows trust roots. TLS verification and permanent settings were preserved.
- Linux cross-builds used the existing `BUN_COMPILE_EXECUTABLE_PATH` override with integrity-verified Bun 1.3.14 runtimes; a spaceless junction alone was insufficient. See the release runbook.
- Automatic discovery remains protocol-version gated. Current verified compatibility is 0.153.4; new model names require no catalog edit, but newer protocol requirements may require a compatibility update.
- User-owned `.codeboarding/` remains untracked and untouched.

## Related

- [[overview]]
- [[stack]]
- [[decisions]]
- [[gotchas]]
