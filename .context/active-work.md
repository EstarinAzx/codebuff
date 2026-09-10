---
type: active-work
project: RD-X-96
updated: 2026-09-11
tags: [context, active-work, release]
---

# Active Work

_Last updated: 2026-09-11 by Codex / GPT-6 (auto)_
_Release source: c3a603da45e6e37ecac59bd8a3921545e8a23c3b_

## Current focus

**RD-X-96 v1.6.0 is published on GitHub and npm, and installed globally. No active work remains.** The user confirmed the computer-use smoke test passed, authorized publication and completed npm's native approval.

## State

- **Published:** fixed source/tag `v1.6.0`; three platform archives plus SHA256SUMS on GitHub before npm; registry-direct `latest` is 1.6.0.
- **Verified:** anonymous downloads of all GitHub assets and the public npm tarball match the prepared files. Installed Windows executable/WASM match the release build. All five installed launcher files match the package after npm's one-byte shebang normalization.
- **Checks:** 252 release tests (687 assertions), common/SDK/CLI/runtime typechecks, independent release review, frozen install/build checks and 11 post-build regression tests. Windows archives were independently extracted and help/version checked.
- **Installed:** `rdx`, `cbm` and `codebuff-mod` each report 1.6.0 from outside the repository. System-certificate handling is in the public launcher; a local launcher patch is no longer needed.
- **Preserved:** both profiles, Grok as active provider, all provider/credential/connector fingerprints, upstream `main`, old release tags and user-owned `.codeboarding/`.
- **Evidence owner:** epic `artifacts/rd-x-96-release-1-6-0/index.md`. Ignored local files are under `cli/dist-binaries/1.6.0/` and `debug/rdx-release-1.6.0/`.

## Pick up here

No active work — start with the user's next task. Use global `rdx`; retained preview executables can report older development versions. Do not repeat this publication or move the release tag.

[Tool documentation](../docs/computer-tools.md) covers Codex subscription search, `/browser on`, `/computer on`, status/off controls and prerequisites. Current control settings were preserved. PLAN excludes automatic managed browser/desktop tools.

For another release, follow [MERGE-STRATEGY.md](../MERGE-STRATEGY.md) with a new version: GitHub assets before npm, native approval, public artifact verification, installation and profile checks.

## Notes and limits

- Source/tag: `c3a603da45e6e37ecac59bd8a3921545e8a23c3b`. Frozen build worktree: `C:/Users/S.D/.traycer/worktrees/estarinazx__codebuff-modded/release-v1-6-0`.
- npm web approval needs an interactive PTY on this machine. Show the complete live URL on its own line; never store it in source/artifacts or reuse an expired request. Preserve account security.
- Windows installation downloaded the public archive. Its normal stderr progress was treated as a PowerShell error by the capture harness; subsequent quiet alias and hash checks passed.
- Linux binaries were cross-built and format-checked, not runtime-executed; WSL/tmux are unavailable here. Live Grok and user computer-use checks ran on the equivalent preview runtime before publication. Post-publication checks covered package integrity, installation and help/version.
- Pre-release installation rollback files remain at `C:/Users/S.D/.config/manicode/backups/before-release-1.6.0-20260911-021300`. No credentials were copied. Release and development worktrees are retained.

## Related

- [[overview]]
- [[pick-up]]
- [[decisions]]
- [[flows]]
