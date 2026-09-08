---
type: active-work
project: codebuff (fork — modded branch)
updated: 2026-09-09
tags: [context, active-work, byok, grok]
---

# Active Work

_Last updated: 2026-09-09 by Codex (auto)_
_Implementation commit: bc2fd502c on modded._
_Release tag: v1.4.1 at e049416ae; published on GitHub and npm._

## Current focus

**v1.4.1 is shipped.** The user authorized publication; source and tag are pushed, GitHub has all verified platform archives, and npm registry-direct latest is 1.4.1. The installed CLI reports 1.4.1 and its executable hash matches the verified Windows build.

## State

- **Done:** /providers:add grok [name], device authorization, separate per-profile credentials, automatic refresh, subscription Responses routing, account-scoped model discovery and cache, provider removal and agent bindings. User documentation is in cli/release/README.md.
- **Done:** 117 targeted tests pass (82 CLI, 35 SDK), including Codex discovery and reasoning replay regressions. Common, SDK and CLI typechecks pass.
- **Done:** independent review found four issues, all fixed and reverified: non-streaming runtime calls, structured-output schemas, incomplete-stream status/usage, and credential-cleanup failure. Review is in the Traycer epic at artifacts/grok-1-4-1-review/index.md.
- **Done:** Windows x64, Linux x64 and Linux arm64 archives are in cli/dist-binaries/1.4.1/, with SHA256SUMS. All include the executable and tree-sitter.wasm. Archive contents and executable formats pass; the extracted Windows executable reports 1.4.1. Linux binaries were not executed.
- **Done:** codebuff-mod@1.4.1 published to npm after the user's native publishing 2FA approval. Its integrity matches the five-file, 9,962-byte dry run. Public GitHub archive digests and the downloadable SHA256SUMS match the local release files.
- **Done:** installed the published npm package, downloaded the public GitHub Windows archive, and verified cbm --version plus the installed executable hash. Provider state hashes are unchanged.
- **Live verification:** xAI accepted the real device-code request and returned https://accounts.x.ai/oauth2/device, 1,800-second expiry and 5-second polling. No user authorization was completed, and no live access/refresh tokens or authenticated inference were tested.

## Pick up here

**No required release work remains.** For first Grok use, run cbm, then /providers:add grok, approve the displayed xAI link, use /model and /providers:test, and try a short coding task exercising a tool call. This activates the new Grok profile. Existing provider selection was preserved during implementation and release. Authenticated Grok inference remains unverified; publication was explicitly requested without that step.

Release: https://github.com/EstarinAzx/codebuff-modded/releases/tag/v1.4.1. Local archives are in the **versioned subdirectory** cli/dist-binaries/1.4.1/; root-level archives remain 1.4.0. Future releases follow [MERGE-STRATEGY.md](../MERGE-STRATEGY.md), Step 6: GitHub assets before npm, with the account's native publishing 2FA approval. On this machine npm needed a TTY for the browser approval flow; a background non-TTY publish returned EOTP.

## Recent context and limits

- The fresh global install had an incomplete tar@7.5.22 directory (CommonJS files missing). The registry tarball contained them and matched its published SHA-512 integrity. Restoring the exact verified package files repaired the local install; no dependency version or published package changed. Previous binary/WASM/metadata copies have suffix .before-1.4.1-234b765f070e40a8920d823aa0f849a3 in ~/.config/manicode.

- Protocol reference: stnly/pi-grok revision 8b304e65c088f84ccb932959d97739245fe47d97, cloned to C:/Users/S.D/AppData/Local/Temp/codebuff-pi-grok-c4ac5b159a9d4525a90cbf2bddc98eac. It was inspected, not installed. See [[2026-09-09-grok-subscription]] for scope and identity-token decisions.
- The machine's Bun TLS probe needed the existing trust bundle via process-local NODE_EXTRA_CA_CERTS=C:/Users/S.D/AppData/Local/Temp/codebuff-windows-trust.pem. TLS verification and permanent settings were preserved. Linux cross-builds reused verified Bun 1.3.14 executables under C:/Users/S.D/AppData/Local/Temp/cbm-runtimes-1.3.14/{x64,aarch64}/package/bin/bun through BUN_COMPILE_EXECUTABLE_PATH.
- Broad Windows suites retain the previous baseline failures; they were not rerun for this provider change. Previous common: 1616 pass / 25 fail, SDK: 517 pass / 92 fail / 15 skip, CLI: 3190 pass / 32 fail / 26 skip. Targeted changes and regressions above pass.
- Saved Codebuff Codex profiles had expired at the 1.4.0 verification. They remain separate and were not overwritten. Reconnect with /providers:add codex when needed. Codex protocol compatibility remains 0.153.4.
- .codeboarding/ is user-owned and remains untracked. Preserve the existing upstream-baseline worktree if comparing platform failures. The upstream history bridge and fork launcher rules remain in the release runbook.

## Related

- [[overview]]
- [[stack]]
- [[decisions]]
- [[gotchas]]
- [[pick-up]]
