---
type: active-work
project: RD-X-96
updated: 2026-09-10
tags: [context, active-work, branding]
---

# Active Work

## Current focus

RD-X-96 **v1.5.1 is public on GitHub; npm approval is pending**. The user authorized publication and was given the live native npm approval link. The fixed release source/tag is `0f688c0bfbf1cf95206c91a738536d52792b361d`. All three archives and the public GitHub digests are verified. This epic's `artifacts/rd-x-96-release-1-5-1/index.md` owns process handles and remaining verification; check the active publish result before retrying.

## State

- **Latest follow-up:** removed the redundant small label from the full banner; compact and text fallbacks remain. All 14 branding/rendering tests pass (297 assertions). The preview uses a new filename so the existing running session is preserved.
- **Implemented:** shared display identity, full/compact animated banner, help/title/export/callback copy, bundled fork-agent identity, launcher messages and docs; `rdx` bin alias and primary command; hot-pink identity/headings and cyan reply borders/code accents in both themes, with the transparent canvas retained.
- **Compatibility:** package/download/storage names remain `codebuff-mod`; `cbm` and `codebuff-mod` remain aliases. Provider/auth logic, routing IDs, animation gates, theme overrides and Freebuff are preserved.
- **Verified:** 26 focused branding/Ghostline/export tests pass (332 assertions); Freebuff mode has 20 pass, 6 expected skips; CLI typecheck passes. Native frames cover dark/light, wide/narrow/short layouts, menus, selected input, animation and the project picker.
- **Review:** independent review found one P3 banner-glyph alignment issue; the `6` outline was corrected and the 26 focused tests passed again. This epic's `artifacts/rd-x-96-review/index.md` records the original finding.
- **Preview:** `cli/bin/rdx-preview.exe`, version `1.5.0-rdx-dev`, built with `bun ./scripts/build-binary.ts rdx-preview 1.5.0-rdx-dev` from `cli/`. Help identifies RD-X-96 and `Usage: rdx`. The sibling `tree-sitter.wasm` is required. Global `rdx` has not been installed.
- **Evidence:** this epic's `artifacts/rd-x-96/index.md` owns confirmed scope and links native renderer captures.

## Next

After native npm approval, verify registry-direct latest and the published tarball against the prepared candidate, install `codebuff-mod@1.5.1` globally, verify `rdx` and compatibility aliases, compare provider fingerprints, and refresh this handoff. If approval expires, obtain a new native URL and show it in chat; preserve account/package security. The completed CBM-01 implementation relay must not restart. [MERGE-STRATEGY.md](../MERGE-STRATEGY.md) owns publication ordering.

## Published baseline and limits

CBM-01 v1.5.0 remains the published and globally installed baseline, at release source `3f0d9c252070a5c962d5d230079685e91731909e`. This epic's `artifacts/cbm-01-release-1-5-0/index.md` owns its asset hashes, npm integrity and installed-binary verification. Those completed release facts do not imply this local rename is published.

No live provider request, profile mutation or global installation was performed for this update. Native component renders and Windows help/version smoke are verified; live interactive terminal acceptance and physical limited-color hardware remain unverified because tmux is unavailable here. `.codeboarding/` remains user-owned and untracked. `main` remains the upstream-tree mirror.

## Related

- [[overview]]
- [[decisions]]
- [[pick-up]]
