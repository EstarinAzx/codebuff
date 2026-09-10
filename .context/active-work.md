---
type: active-work
project: RD-X-96
updated: 2026-09-11
tags: [context, active-work, web, computer-tools]
---

# Active Work

_Last updated: 2026-09-11 by Codex / GPT-6 (auto)_

## Current focus

The search/browser/Windows upgrade is implemented and verified on `feature/rdx-web-computer-tools`. The user explicitly requested all three without another API key. The Windows preview is `1.5.2-dev.tools`; the installed/public release remains `1.5.1`.

## State

- **Done:** saved Codex subscription supplies search while Grok remains selected; opt-in `/browser on` and `/computer on`, with status/off controls. Actual DEFAULT/LITE search and mode registration are covered. PLAN receives no automatic local-control tools.
- **Verified:** 190 focused tests; common/SDK/CLI/runtime typechecks; real sourced search; real browser navigation/type/click/screenshot; real Windows type/click/screenshot. Independent review has no remaining actionable blockers. Windows preview build and help/version smoke passed.
- **Evidence:** current epic `artifacts/rdx-web-computer-tools/index.md` and `artifacts/rdx-web-computer-review/index.md`. Ignored live evidence is `debug/local-tools/` in the feature worktree.
- **Remaining choice:** integrate/install or publish the preview. No release or global CLI replacement was performed. The existing 1.5.1 release and fixed tag remain complete.

## Pick up here

Use `C:/Users/S.D/.traycer/worktrees/estarinazx__codebuff-modded/feature-rdx-web-computer-tools`. Launch its `cli/bin/rdx-web-tools.cmd` for the preview; the wrapper enables trusted system certificates only for that process. `docs/computer-tools.md` owns usage, dependencies and access behavior.

If asked to integrate or release, read [MERGE-STRATEGY.md](../MERGE-STRATEGY.md), retain `main` as the upstream mirror, preserve provider/auth settings, and use a new version for publication. Do not restart the old release relay. User-owned `.codeboarding/` in the primary checkout stays untouched.

## Recent context

- The user rejected requiring a Tavily/Brave/Serper key. A saved Codex subscription supplies search instead; this consumes its plan allowance.
- PowerShell browser discovery initially timed out because npm retried an untrusted certificate chain. Scoped system trust fixed fresh downloads as well as cached startup. TLS verification and permanent settings remain intact.
- Local tools are opt-in. First use may download pinned packages. Browser requires Node 22.15+; desktop uses uv/Python 3.13.
- Live tests touched disposable targets. Linux/macOS control, elevated/protected Windows apps and interactive TUI behavior were not live exercised. Screenshot conversion is regression-tested; no new end-to-end Grok inference was performed.

## Related

- [[overview]]
- [[pick-up]]
- [[decisions]]
- [[flows]]
