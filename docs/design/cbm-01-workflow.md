# CBM-01 workflow and merge strategy

The [spec](../prd.md) owns scope and the [ticket queue](../prd.md#work-queue) owns progress. This file owns execution order. [MERGE-STRATEGY.md](../../MERGE-STRATEGY.md) remains the authority for upstream sync and release mechanics.

## Execute

1. Rehydrate `.context/pick-up.md`, the spec, and the queue. Re-read `.claude/vibe.md` for unresolved decisions. Respect the latest user correction: **CBM-01**.
2. Keep planning and baton commits on `modded`. It is the fork branch. The generic ticket-loop instruction to put context on `main` is inapplicable here because `main` must preserve the exact upstream tree.
3. Create or reuse the isolated `feature/cbm-01` worktree from `modded`; inspect existing work before creating a branch. Preserve user-owned `.codeboarding/` and the existing upstream-baseline worktree. Only one worker writes the feature branch at a time.
4. Execute one unblocked ticket per fresh Traycer worker. Use the existing `$relay N=1 /preset ticket-loop` behavior with these repository overrides. The controller owns relay state; the worker owns only its ticket checkpoint and implementation. No Claude launcher or Wisp route changes.
5. Ticket 01 runs independently of visual selection. Ticket 02 waits for the user's direction; neither the default HTML radio selection nor an agent recommendation is approval. Stop the relay with `needs_visual_direction` when no unblocked implementation ticket remains. Preserve the queue rather than marking it complete.
6. Each worker checks existing branches/commits before acting, implements the ticket, runs relevant verification, commits only its files, records evidence in the ticket, and reports `continue`, `done`, or `blocked`. This request authorizes local work, not remote publication. No blanket staging, public issue/comment creation, package release, or credential changes.
7. The controller independently checks results and obtains a cold review. Failed checks stop integration. Known baseline failures must be reproduced at the base revision before being classified as pre-existing.
8. On full verification, merge `feature/cbm-01` into `modded` with `--no-ff`. This preserves the implementation commits and creates one revertible integration boundary. Never merge it into `main` or force-push either published branch. Leave remote publishing for a separate user request.

## Merge surfaces

| Surface | Preserve on an upstream sync | Verification |
| --- | --- | --- |
| Display identity and logos | CBM-01 shared display string; measured full/small art widths and short-height fallback | Branding regression and title/help/logo render checks |
| Theme | User-selected direction through existing dark/light semantic tokens; user overrides and color fallbacks | Theme tests plus wide/narrow/light/dark smoke |
| Header and visible messages | Fork display identity while retaining upstream behavior | Audit user-owned strings, exports, callback copy, and launcher messages |
| Distribution | Existing package names, aliases, filenames, endpoints and updater ordering until a separate migration | Launcher/build smoke; inspect download construction |
| Providers and credentials | Existing bypass guards, profile identity, bindings, discovery, OAuth isolation and refresh | Provider/auth preservation tests |
| Attribution | Original LICENSE and NOTICE provenance | Inspect diff; keep notices intact |

Changes adjacent to upstream code should retain the existing `PORT:` convention when it explains a real fork difference. Keep fork-only helpers small. Avoid mass renames of imports, files, events, or environment keys.

## Upstream sync after this work

Follow the existing upstream → main → modded recipe. `main` mirrors the upstream **tree**, not necessarily its commit ID, because the recorded history bridge must survive. Prepare the merge on an isolated branch, resolve every conflict using the map, and run branding checks alongside the existing provider checks. A reintroduced upstream label is a regression even if TypeScript passes.

The implemented identity check is `bun test ./src/__tests__/branding.test.tsx` from `cli/`; also run it with process-local `FREEBUFF_MODE=true`. It covers help, title/export identity, callback escaping, actual rendered logo dimensions, launcher output, and assembled tool descriptions for the bundled fork agent closure. The exact provider/type/build verification and limitations are recorded once in [ticket 01](../issues/01-cbm-01-identity.md).

## Rollback and release

For a regression after local integration, revert the feature merge with `git revert -m 1 <merge-sha>` after inspecting its first parent. This preserves history. Before integration, retain the worktree/branch for review instead of deleting work.

No release is part of this request. A future release uses the existing manual runbook: matching launcher/binary versions, verified platform archives and WASM, GitHub assets before npm, and the account's native publication approval. Changing the product display name does not itself choose a package rename or version number.

## Resume

Use `$preset pick-up`. If a visual direction has been chosen, record the exact user choice in the spec and queue, then resume the stopped Traycer relay explicitly. No confirmed visual bar exists, so gauntlet is not enabled.
