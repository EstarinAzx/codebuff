---
type: handoff
updated: 2026-09-08
---

# Pick up

**Start: read `.context/overview.md` + `.context/active-work.md`.**

**v1.4.0 is shipped.** Upstream snapshot `ab19b7582` is merged and pushed on `modded`; npm registry-direct `latest` is 1.4.0. GitHub has the tag and all three verified platform archives, including `tree-sitter.wasm`. Fresh installation from npm runs `cbm` 1.4.0 and matches the verified Windows binary hash. Independent review has no remaining actionable findings.

**Next task: none required.** To use Codex, reconnect the desired expired Codebuff OAuth profile with `/providers:add codex`, then run `/model`. Astra and future compatible account-visible models are discovered automatically. Native Codex credentials were used only in memory for live catalog and tool-call validation; existing provider selection was preserved.

Landmines: upstream rewrote history, so `main` mirrors content via an append-only bridge rather than identical commit IDs. Codex protocol compatibility is 0.153.4; discovery and credential refresh are bounded and caches are profile-scoped. Broad Windows test suites retain documented baseline failures. Future npm releases need publishing 2FA approval. `.codeboarding/` is the user's and stays untracked.

## Related

- [[overview]]
- [[active-work]]
