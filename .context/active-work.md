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

Finish the user-authorized **CBM-01 v1.5.0** release. [GitHub v1.5.0](https://github.com/EstarinAzx/codebuff-modded/releases/tag/v1.5.0) is public with verified Windows x64, Linux x64, Linux arm64 and SHA256SUMS assets. **npm remains at 1.4.1 because its saved login is invalid.**

## State

- **Done:** reviewed CBM-01 identity, Ghostline design, animated violet banner and responsive picker fixes; versioned source, builds and GitHub publication.
- **Verified:** common/sdk/cli typechecks; 67 focused release tests; Freebuff 8 pass / 6 expected skips; shared attribution 5 pass; runtime attribution 2 pass / 15 unrelated cases filtered. Archive headers, member hashes, executable modes and public asset digests match. Independently extracted Windows help/version reports CBM-01 1.5.0.
- **Waiting on user:** native npm sign-in. Publishing returned E404; subsequent whoami/access checks returned E401. Public owner remains tsd47216. Traycer has opened the native login page for the user. Account/package security is unchanged.
- **Ready:** exact five-file `cli/dist-binaries/1.5.0/codebuff-mod-1.5.0.tgz` passed `npm publish --dry-run`. Publish this tarball after authentication, then verify registry integrity and the installed version.
- **Distribution state:** global `cbm` remains 1.4.1. The source development executable also remains 1.4.1; release builds used `C:/Users/S.D/.traycer/worktrees/estarinazx__codebuff-modded/release-v1-5-0`. Preserve running apps and existing provider/credential state.
- **Evidence:** this epic's `artifacts/cbm-01-release-1-5-0/index.md` owns asset hashes, npm integrity, commands, login session handles and next steps. Local build record is `cli/dist-binaries/1.5.0/build-record.json`.
- **Branch protection:** peeled `v1.5.0` is `3f0d9c252070a5c962d5d230079685e91731909e`. `main` remains `88c4df13a` with the same tree as local `upstream/main`. Subsequent handoff commits do not move the release tag.

## Pick up here

Check the release artifact and live GitHub/npm state before repeating any publication. After the user completes the pending login, verify npm identity and publish the exact prepared tarball. Use native publishing approval if npm requests it. Verify registry-direct latest/integrity, install the published package, check `cbm --version` and the installed binary/WASM hashes, and compare the private provider-file fingerprint baseline. Refresh this handoff and overview after success.

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
