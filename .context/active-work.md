---
type: active-work
project: CBM-01
updated: 2026-09-10
tags: [context, active-work, branding]
---

# Active Work

_Last updated: 2026-09-10 by GPT-6 Astra (auto)_
_Original merge: 5cc13014d. Animated-banner restoration is verified locally on modded._

## Current focus

The original rebrand and the user's animated **CBM-01** banner follow-up are complete locally. Ghostline violet and the existing sheen are restored, with responsive banner/text fallbacks and corrected project-picker sizing. [Design](../DESIGN.md) and the merge map record the correction. The old three-leg relay stays closed.

## State

- **Done:** animated banner and picker correction. Final focused checks: 19 pass; Freebuff 8 pass / 6 expected skips; CLI typecheck and Windows build pass. Animation/paused-state and actual-picker regressions failed before their fixes. Independent review approved after verifying 32 picker configurations. Review: `artifacts/cbm-01-banner-review` in this epic. Captures: `debug/cbm-01/animated-banner/`.
- **Current local executable:** `cli/bin/codebuff-mod.exe`, SHA-256 `235e73948791aa1c398c63ec13c8866b1479209a2bda4994e9f5b1c3035341d7`. It still reports 1.4.1; no release/version/global installation change. This supersedes the earlier local binary hash in ticket 03. Final build log: Traycer shell `ef032729-aa27-4230-bf80-a33cd28218b5`.
- **Done:** identity, generated-footer cleanup, compact Ghostline layout, dark/light colors, contrast corrections, and compatibility checks. The feature was merged into `modded` with `--no-ff`; `main` remains at `88c4df13a` and its tree still matches local `upstream/main`.
- **Verified by controller:** 65 integrated identity/theme/export/streaming/provider tests, seven Freebuff branding tests, CLI typecheck, binary help/version, expected executable/WASM hashes, and unchanged runtime sources against the reviewed candidate. Exact commands, hashes and limits are in [ticket 03](../docs/issues/03-cbm-01-integration.md).
- **Review:** identity, Ghostline and final combined reviews have no open actionable findings. Native component frames cover wide/narrow/short, dark/light, focused controls and cleared input. Live interactive terminal acceptance remains unverified because tmux is unavailable; physical limited-color hardware was not tested.
- **Local build:** `cli/bin/codebuff-mod.exe` with sibling `tree-sitter.wasm`. Run `.\cli\bin\codebuff-mod.exe` from this repo to use it. The installed global `cbm` is unchanged. No release, push, version bump, package migration, login or inference occurred.
- **Queue:** empty. `.claude/relay/cbm-01.traycer.json` records completion and cleanup. Do not resume completed implementation legs.

## Pick up here

No required implementation remains. Run the rebuilt local executable to inspect the animated banner. Preserve the user's provider state and any current sessions. Do not restart the completed relay or publish a release without a new request.

## Recent context

- Product name is exactly **CBM-01**, zero and no spaces. The user explicitly chose Ghostline. Display copy is rebranded; technical package/env/protocol/storage identifiers and original notices remain intentional compatibility/provenance facts.
- v1.4.1 was already publicly shipped before this work. The local redesigned build still reports 1.4.1; it has not replaced the published release or global installation. Prior release evidence remains in git at `426480b8c`.
- The feature worktree remains at `C:/Users/S.D/.traycer/worktrees/estarinazx__codebuff-modded/feature-cbm-01`, with rendered evidence under `debug/cbm-01/ghostline/`. It is retained for inspection; no worktree cleanup was requested. `.codeboarding/` is user-owned and stays untracked.
- The two baseline runtime-schema failures and older broad Windows suite failures are documented in tickets 01/03; focused passes do not mean those failures disappeared.
- Existing process-local Bun trust bundle: `C:/Users/S.D/AppData/Local/Temp/codebuff-windows-trust.pem`. Existing cross-build executables: `C:/Users/S.D/AppData/Local/Temp/cbm-runtimes-1.3.14/{x64,aarch64}/package/bin/bun`. Preserve TLS and permanent settings.
- HTML comparison is saved at `docs/design/cbm-01-options.html`. The optional local preview server is Traycer shell `a5b9804f-ae54-460f-b3c9-432507adfbaf` at 127.0.0.1:47831, serving only `docs/design`; it does not survive host restart.

## Related

- [[overview]]
- [[decisions]]
- [[gotchas]]
- [[happy-path]]
- [[pick-up]]
