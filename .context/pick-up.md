---
type: handoff
updated: 2026-09-08
---

# Pick up

**Start: read `.context/overview.md` + `.context/active-work.md`.**

Upstream sync and Codex discovery are complete on pushed `modded`; v1.4.0 is tagged and released on GitHub. Local `cbm --version` is 1.4.0. All three release archives are verified and contain the executable plus `tree-sitter.wasm`.

**Next task: finish npm publishing after sign-in.** npm `whoami` returns 401; `latest` is still 1.3.2. The 1.4.0 publish dry-run passed; an actual publish was rejected while the CLI token remained unauthenticated. Follow [MERGE-STRATEGY Step 6](../MERGE-STRATEGY.md): authenticate, publish from `cli/release`, confirm registry-direct latest, then update the handoff. GitHub release and tag already exist; do not overwrite them.

Codebuff's three stored Codex OAuth grants also return 401. The desired account needs `/providers:add codex` again. Native Codex credentials were used only in memory to verify Astra discovery and a real tool call with visible final text. Active `opencode-go` settings were preserved.

Landmines: upstream history was rewritten; `main` now mirrors content via an append-only bridge, not identical commit IDs. Current Codex protocol is 0.153.4; catalog and auth requests are bounded and caches are scoped per profile. Broad Windows test failures have documented baselines. `.codeboarding/` is the user's and stays out of commits.

## Related

- [[overview]]
- [[active-work]]
