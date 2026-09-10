---
type: active-work
project: RD-X-96
updated: 2026-09-10
tags: [context, active-work, release]
---

# Active Work

_Last updated: 2026-09-10 by Codex / GPT-6 (auto)_
_Release source: 0f688c0bfbf1cf95206c91a738536d52792b361d_

## Current focus

**RD-X-96 v1.5.1 is published and installed. No active release work remains.** The user authorized the release and completed npm's native publishing approval. Use the global `rdx` command.

## State

- **Done:** source/tag and GitHub assets published before npm; npm tarball verified against the prepared candidate; global installation completed.
- **Verified:** all three public platform archives match their local hashes. The installed Windows binary and WASM match the verified build; `rdx`, `cbm` and `codebuff-mod` each report 1.5.1 from a directory outside the repository. Help identifies RD-X-96 and `Usage: rdx`.
- **Release checks:** 83 focused CLI/provider tests; common/SDK/CLI typechecks; 8 Freebuff checks with 6 expected skips; 5 shared attribution checks; 2 runtime attribution checks with 15 unrelated cases filtered. The frozen release checkout also passed its 14 branding/Ghostline checks after the three builds.
- **Preserved:** providers.json, codex-oauth.json, grok-oauth.json and credentials.json match both release-start and pre-install fingerprints. Account/package security and permanent TLS settings were not changed. `main` remains the upstream-tree mirror.
- **Evidence:** this epic's `artifacts/rd-x-96-release-1-5-1/index.md` owns source hashes, package integrity, archive hashes and installed verification. Ignored local evidence is in `cli/dist-binaries/1.5.1/`.

## Pick up here

No active work. Start from the user's next task. Use `rdx` for the shipped build; retained `cli/bin/rdx*.exe` development previews can report an older dev version. Keep the release tag fixed. Future releases use a new version and [MERGE-STRATEGY.md](../MERGE-STRATEGY.md).

## Recent context

- The exact identity is RD-X-96. Current colors, transparent canvas and compact-banner behavior are owned by [DESIGN.md](../DESIGN.md).
- npm approval requires an interactive PTY here. Show its complete live URL on its own line; the user could not find labeled links. The runbook records this workflow.
- Linux binaries were cross-built and format-checked, not runtime-executed. Live provider inference and physical limited-color hardware were not exercised. Native renderer checks and Windows help/version smoke passed.
- Release/feature worktrees and native captures are retained. `.codeboarding/` remains user-owned and untracked. The old CBM-01 implementation relay stays complete.

## Related

- [[overview]]
- [[pick-up]]
- [[decisions]]
