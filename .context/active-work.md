---
type: active-work
project: RD-X-96
updated: 2026-09-11
tags: [context, active-work, local-install]
---

# Active Work

_Last updated: 2026-09-11 by Codex / GPT-6 (auto)_

## Current focus

The search/browser/Windows preview is integrated into `modded` and installed locally as `1.5.2-dev.tools.1`. The user explicitly authorized this installation. The first-request MCP schema crash is fixed. No active implementation or installation work remains.

## State

- **Installed:** `rdx`, `cbm` and `codebuff-mod` each report `1.5.2-dev.tools.1` from outside the repository. The installed executable and WASM match the tested preview hashes.
- **Integrated:** feature source `ec079585bf19020dc62f36d0f1ee50a20edc6518` merged at `ba8805e49`. The sole merge conflict was the handoff note. The launcher now accepts this prerelease so it does not downgrade to 1.5.1; later stable versions remain eligible for updates.
- **Verified:** 239 regression tests; runtime/SDK/CLI typechecks; independent review; real browser/desktop schema preparation; a real Grok tool round trip and a second real run through the rebuilt public SDK/complete agent loop. All aliases and installed hashes match the fixed build.
- **Preserved:** both provider profiles, Grok as the active provider, all four credential/provider files, connector settings, no user process was stopped by the installer, upstream `main`, and user-owned `.codeboarding/`. Settings fingerprints match before and after installation.
- **Local only:** no push or publication. Public release/tag 1.5.1 remains unchanged. The npm launcher package itself still identifies as 1.5.1; its installed-binary metadata correctly selects the local preview.

## Pick up here

Use global `rdx`. Open a new session to load the upgrade; an already-running session was deliberately left running on its old executable. Web search uses the saved Codex profile without changing Grok. `/browser on` and `/computer on` enable local tools; status/off controls are in [tool documentation](../docs/computer-tools.md).

No active work — start from the user's next task. Follow [MERGE-STRATEGY.md](../MERGE-STRATEGY.md) if asked to publish a stable release, using a new version and preserving the old tag.

## Schema crash fix

The schema pipeline keeps immutable Zod instances and preserves original JSON Schema separately from validation. Deep copying Zod erased its private state; converting custom integer validators back to JSON erased tool parameters. Internal step flags are excluded from external argument validation. No dependency or provider changes were needed.

The epic artifact `artifacts/rdx-mcp-schema-fix/index.md` owns the fix, tests, live evidence and rollback location. Evidence is also in `debug/mcp-schema-fix/`.

## Installation notes

- Rollback files: `C:/Users/S.D/.config/manicode/backups/rdx-local-preview-20260911-005953`. Credentials were not copied into backups; only fingerprints were recorded.
- Installed launcher has a process-scoped `BUN_OPTIONS=--use-system-ca` addition for this machine. Permanent environment/TLS settings were not changed. Preserve this local trust handling when reinstalling; npm replacement can overwrite the installed launcher.
- Full evidence: epic `artifacts/rdx-web-computer-install/index.md`; ignored local files in `debug/local-install-1.5.2-dev.tools/`.
- The retained feature worktree still holds the original tested build. It is not required to launch the installed binary.

## Related

- [[overview]]
- [[pick-up]]
- [[decisions]]
- [[flows]]
