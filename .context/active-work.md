---
type: active-work
project: CBM-01
updated: 2026-09-10
tags: [context, active-work, branding]
---

# Active Work

_Last updated: 2026-09-10 by GPT-6 Astra (auto)_
_Planning based on modded at 426480b8c; rebrand work is not yet integrated._

## Current focus

Rebrand the standalone fork as **CBM-01** (zero, no spaces), compare cyberpunk directions, and preserve future upstream merges. [Spec](../docs/prd.md) and [workflow](../docs/design/cbm-01-workflow.md) own scope and execution.

## State

- **Done:** baton rehydrated, exact name corrected, source/compatibility audit completed, and eight file warrants plus the correction verified mechanically. Independent same-model Pressure accepted identity-only work and the documented technical-identifier exception.
- **Done:** [HTML comparison](../docs/design/cbm-01-options.html) offers Neon Circuit, Amber Grid, and Ghostline across three sample screens. All 18 direction/screen/width combinations passed live DOM/layout checks at 1440 and 390 pixels, without horizontal page overflow. Keyboard selection and visible focus outline passed; browser console had no errors. Screenshot capture stalled and was stopped, so screenshot QA is not claimed.
- **Done:** local spec, tickets, workflow, product context, and merge-map amendment saved. No public issues or release created.
- **Next:** isolated identity-only implementation of [ticket 01](../docs/issues/01-cbm-01-identity.md) under Traycer relay. Inspect `.claude/relay/cbm-01.traycer.json` if present before starting anything; it owns worker state.
- **Waiting:** [ticket 02](../docs/issues/02-cbm-01-theme.md) needs the user's visual direction. Default A in the HTML is not approval. [Ticket 03](../docs/issues/03-cbm-01-integration.md) follows 01 and 02.

## Pick up here

Read [[pick-up]], `.claude/vibe.md`, the spec, and the current ticket checkpoint. Check live git and relay state before claiming implementation is running or complete. Use the latest user message for the direction. Keep context and fork code off `main`; it must remain an exact upstream tree mirror.

## Skills for next session

- preset pick-up / relay: rehydrate the queue; continue only the recorded worker/leg.
- impeccable: apply a selected direction after refreshing product context.
- traycer-review: obtain a cold review of substantive code changes.

## Open questions

- Which direction: A Neon Circuit, B Amber Grid, C Ghostline, or a specified combination?
- Package/repository migration and public release are deferred; preserve working compatibility identifiers.

## Recent context

- v1.4.1 was shipped before this work: tag e049416ae; release assets in `cli/dist-binaries/1.4.1/`, installed executable verified. Prior release evidence is in git at 426480b8c. Authenticated Grok inference remains unverified; publication had been separately authorized.
- Preserve active provider selection, separate Codex/Grok credential stores, and model discovery. No current sign-in or live inference is authorized by the rebrand task. `.codeboarding/` is the user's and stays untracked.
- Existing broad Windows baselines: common 1616 pass / 25 fail; SDK 517 pass / 92 fail / 15 skip; CLI 3190 pass / 32 fail / 26 skip. Previous 117 targeted provider tests and package typechecks passed; these counts are historical, not this task's verification.
- Existing process-local Bun trust bundle: `C:/Users/S.D/AppData/Local/Temp/codebuff-windows-trust.pem`. Existing cross-build executables: `C:/Users/S.D/AppData/Local/Temp/cbm-runtimes-1.3.14/{x64,aarch64}/package/bin/bun`. Preserve TLS and permanent settings.
- Local preview server: Traycer shell `a5b9804f-ae54-460f-b3c9-432507adfbaf`, bound to 127.0.0.1:47831, serving only `docs/design`. It does not survive a host restart. HTML also opens directly from disk.

## Related

- [[overview]]
- [[decisions]]
- [[gotchas]]
- [[happy-path]]
- [[pick-up]]
