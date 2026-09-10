---
type: active-work
project: CBM-01
updated: 2026-09-10
tags: [context, active-work, release]
---

# Active Work

_Last updated: 2026-09-10 by GPT-6 Astra (auto)_
_Release source: 3f0d9c252070a5c962d5d230079685e91731909e_

## Current focus

**CBM-01 v1.5.0 is shipped and verified.** [GitHub](https://github.com/EstarinAzx/codebuff-modded/releases/tag/v1.5.0) has Windows x64, Linux x64, Linux arm64 and SHA256SUMS assets; [npm](https://www.npmjs.com/package/codebuff-mod/v/1.5.0) latest is 1.5.0. The global `cbm` is updated and reports 1.5.0. No active implementation or release task remains.

## State

- **Done:** reviewed CBM-01 identity, Ghostline design, animated violet banner and responsive picker fixes; versioned source, builds, GitHub publication, npm publication and global installation.
- **Verified:** common/sdk/cli typechecks; 67 focused release tests; Freebuff 8 pass / 6 expected skips; shared attribution 5 pass; runtime attribution 2 pass / 15 unrelated cases filtered. Archive headers, member hashes, executable modes and public asset digests match. Independently extracted Windows help/version reports CBM-01 1.5.0.
- **Published verification:** npm's public tarball matches the prepared package byte-for-byte and latest is 1.5.0. The installed launcher fetched the public Windows archive; executable and WASM hashes match the verified build. Global `cbm --version` and `--help` pass.
- **Preserved:** providers.json, codex-oauth.json, grok-oauth.json and credentials.json match their pre-release hashes. Native npm login and publishing approval completed; account/package security and permanent TLS settings were not changed.
- **Run:** `cbm`. The source development `cli/bin/codebuff-mod.exe` still reports 1.4.1 because release builds used `C:/Users/S.D/.traycer/worktrees/estarinazx__codebuff-modded/release-v1-5-0`; use the updated global command for the shipped build.
- **Evidence:** this epic's `artifacts/cbm-01-release-1-5-0/index.md` owns asset hashes, npm integrity, commands and limits. Local build record is `cli/dist-binaries/1.5.0/build-record.json`.
- **Branch protection:** peeled `v1.5.0` is `3f0d9c252070a5c962d5d230079685e91731909e`. `main` remains `88c4df13a` with the same tree as local `upstream/main`. Subsequent handoff commits do not move the release tag.

## Pick up here

No active work. The release and old implementation relay are complete; start from the user's next task. Before any future release, read `MERGE-STRATEGY.md` and use a new version. Before upstream integration, preserve the CBM-01/Ghostline seams and the upstream-tree mirror `main`.

## Recent context

- Exact display name: **CBM-01**, zero and no spaces. The user selected **C: Ghostline** and explicitly requested restoring animation. Distribution names and original notices remain compatible.
- The three-leg implementation relay is complete; do not restart it. [Ticket 03](../docs/issues/03-cbm-01-integration.md) and this epic's banner review hold earlier verification and rollback evidence.
- Linux binaries are cross-built and format-checked, not runtime-tested. Live interactive terminal acceptance and physical limited-color hardware remain unverified. Existing broad Windows/runtime-schema failures are documented and not waived.
- Existing process-local trust bundle: `C:/Users/S.D/AppData/Local/Temp/codebuff-windows-trust.pem`. Preserve TLS verification and permanent settings. Private provider fingerprints are outside the repository; no credential content is in release evidence.
- Feature/release worktrees and native renderer evidence are retained. `.codeboarding/` belongs to the user and remains untracked.

## Related

- [[overview]]
- [[decisions]]
- [[gotchas]]
- [[pick-up]]
