# 03: Verify integration and preserve the fork through merges

**What to build:** A reviewed local CBM-01 build can be integrated into modded, and future upstream syncs retain the branding, terminal behavior, and existing provider guarantees.

**Blocked by:** 01 and 02 (both verified complete on feature/cbm-01).

**Status:** integration scope complete; controller final handoff pending

- [x] Independently review the complete diff and resolve actionable findings.
- [x] Run targeted identity/theme/provider regressions and affected package typechecks.
- [x] Build and smoke the local binary, recording the exact commands and limitations.
- [x] Update the merge conflict map with the actual final brand/theme seams and checks.
- [x] Integrate the verified feature branch into modded as one revertible merge; main remains an upstream tree mirror.
- [ ] Refresh the baton with the final state, remaining compatibility exceptions, and next action.
- [x] Leave publication, distribution renaming, and any version decision for a separate explicit request.

## Checkpoint

Relay `cbm-01`, leg 3, worker `9be65d30-7901-4d73-9f3d-a146d671b9dd`, one completed integration unit, outcome `done` for this worker's scope. The controller must independently verify this result, refresh `.context` and relay state, and close the unchecked final baton criterion. This checkpoint does not claim the controller has done that work.

This ticket may perform local integration only when the controller's brief explicitly grants the source checkout. Inspect the complete code diff and existing review artifacts, verify the combined candidate, then merge `feature/cbm-01` into `modded` with `--no-ff`. Keep `main` unchanged. Preserve the user's untracked `.codeboarding/`; stop on unexpected changes rather than stashing or discarding them. Commit final ticket evidence on `modded`; the controller writes `.context/` and relay state. No push, publication, global installation, release version change, or live authentication.

### Integration and review

On 2026-09-10, merged into source `D:/.claude/claude projects/codebuff` with `git merge --no-ff feature/cbm-01 -m 'merge: integrate reviewed CBM-01 identity and Ghostline'`. No conflicts. Source had no tracked changes; only the preserved user-owned `.codeboarding/` was untracked. Relay owner/worker/leg/stop checks matched at every work boundary.

- Merge: `5cc13014d5d9d54ae49da5451775c0d82329b1fa`.
- First parent (source `modded`): `185b6c37e48a1350709d2770c348d911f2f75321`.
- Second parent / unchanged feature HEAD: `4e505bc114b4ac905544e97fcaa0d67d1d81b4b8`.
- `main` before/after: `88c4df13abc4358042277462d7d6a8e018b5f00a`. Both `main^{tree}` and local `upstream/main^{tree}` remain `f8274d59eee1345e22128a8d39167d4b1ea0b624`; no fetch or push occurred.
- Integrated runtime source is identical to the reviewed feature. The only initial tree differences are the controller's newer `.claude`/`.context` records. The merge did not change those source records.
- Final cold review: `C:/Users/S.D/.traycer/epics/534ebcad-526b-42d9-a142-dfd98ca72ffd/artifacts/cbm-01-final-review/index.md`. No open actionable findings. Prior generated-footer and light inverse-label fixes remain correct. The one stale README status sentence was corrected with controller authorization in the final documentation commit.

The merge map retains the actual identity, measured Freebuff-logo, Ghostline palette, opaque input, inverse-label, and fork attribution seams. Revert this feature boundary with `git revert -m 1 5cc13014d5d9d54ae49da5451775c0d82329b1fa` after inspecting the first parent; subsequent documentation is separate.

### Fresh verification

Bun 1.3.14. Pre-merge feature evidence and exact commands are in the final review: 62 combined identity/theme/export/clipboard/streaming tests; 5 shared attribution tests; 2 runtime attribution tests (15 unrelated cases filtered); 55 Freebuff/provider/export tests; CLI typecheck and whitespace check. All selected checks passed. The controller's earlier broader checks are supplemental, not relabeled as fresh results.

After merging, ran from source root:

```sh
NODE_EXTRA_CA_CERTS='C:/Users/S.D/AppData/Local/Temp/codebuff-windows-trust.pem' bun install --frozen-lockfile
NODE_EXTRA_CA_CERTS='C:/Users/S.D/AppData/Local/Temp/codebuff-windows-trust.pem' bun cli/scripts/build-binary.ts codebuff-mod 1.4.1
bun run --cwd cli typecheck
./cli/bin/codebuff-mod.exe --help
./cli/bin/codebuff-mod.exe --version
```

Frozen install checked 812 installs across 808 packages with no changes. The integrated source was built once, including SDK assets, bundled agents and native OpenTUI; build exit 0. The first shell failed to start because its working-directory string contained an accidental space; correcting that path started the only actual build. No permanent environment/config changes. Typecheck exit 0 with no TypeScript diagnostics; PowerShell's redirected log wraps Bun's ordinary stderr command echo in `NativeCommandError`. Help/version both exit 0: `Usage: cbm`, `CBM-01 CLI`, `1.4.1`.

From source `cli/`:

```sh
bun test src/__tests__/branding.test.tsx src/__tests__/ghostline.test.tsx src/commands/__tests__/export-conversation.test.ts src/components/__tests__/message-block.streaming.test.tsx src/components/__tests__/message-block.completion.test.tsx src/utils/__tests__/auth-oauth-preservation.test.ts src/utils/__tests__/providers.test.ts src/utils/__tests__/providers-models-codex.test.ts
FREEBUFF_MODE=true bun test src/__tests__/branding.test.tsx
```

Results: **65 passed, 0 failed, 448 assertions**; Freebuff **7 passed, 0 failed, 73 assertions**. Environment flags were process-local. Source logs: `debug/cbm-01/integrated-source-{tests,typecheck,help,version,freebuff}.log`. Build log: `C:/Users/S.D/.traycer/commands/534ebcad-526b-42d9-a142-dfd98ca72ffd/96283eb7-a3ed-43aa-bd16-37893af194ce/output.log`. `git diff --check` passed; lockfile and manifest versions were unchanged by install/build.

### Local build and limits

Usable local binary: `D:/.claude/claude projects/codebuff/cli/bin/codebuff-mod.exe`, built from the integrated merge. Its required `tree-sitter.wasm` sibling is present.

| File | SHA-256 |
| --- | --- |
| `codebuff-mod.exe` | `43b694f22e37a8b7a4a2241c348be89601039ab91fe5732914886ce3be543534` |
| `tree-sitter.wasm` | `f38dcc4b43b818f9a0785bc1c6d5611a75ac4cdd428ff3f02757c34ca4e46d7f` |

The installed global `cbm` was not replaced. No release, version bump, public issue, PR, push, login, inference, provider selection, credential, or global-setting change occurred. Original notices and technical distribution/env/protocol/storage identifiers remain intact.

Representative dark wide, light narrow, short active and filled-control native SVG/text/PNG frames were inspected at `C:/Users/S.D/.traycer/worktrees/estarinazx__codebuff-modded/feature-cbm-01/debug/cbm-01/ghostline/`. They compose production components with controlled data, not a full live app. `tmux` is unavailable; live interactive acceptance and physical limited-color hardware remain unverified. PNG glyph substitutions from local Consolas remain a conversion limitation. The two baseline runtime-schema failures documented in ticket 01 remain failures, not waived passes; the relevant attribution checks pass.
