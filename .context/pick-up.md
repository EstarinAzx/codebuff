---
type: handoff
updated: 2026-09-11
---

# Pick up

The search/browser/Windows upgrade is complete on `feature/rdx-web-computer-tools`, commit `ec079585bf19020dc62f36d0f1ee50a20edc6518`. Read the [feature worktree handoff](C:/Users/S.D/.traycer/worktrees/estarinazx__codebuff-modded/feature-rdx-web-computer-tools/.context/active-work.md) for the current task.

Preview: `C:/Users/S.D/.traycer/worktrees/estarinazx__codebuff-modded/feature-rdx-web-computer-tools/cli/bin/rdx-web-tools.cmd`, version `1.5.2-dev.tools`. It uses the saved Codex subscription for search while keeping Grok selected, and provides `/browser on` and `/computer on` without another service API key. 190 focused tests, four package typechecks, live search/browser/desktop checks, review and the Windows build passed. The epic's `artifacts/rdx-web-computer-tools/index.md` owns evidence.

This primary checkout and globally installed `rdx` still represent release 1.5.1; the feature has not been integrated, installed globally or published. If asked to do that, use the feature branch and [MERGE-STRATEGY.md](../MERGE-STRATEGY.md). Keep the old release tag fixed, preserve provider/auth/TLS settings, retain upstream `main`, and leave user-owned `.codeboarding/` alone. This handoff is a separate context-only change on `modded`; retain the feature's final handoff when reconciling it during integration.

## Related

- [[overview]]
- [[active-work]] — installed-release context; the feature handoff above owns the new work
