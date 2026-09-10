---
type: handoff
updated: 2026-09-10
---

# Pick up

Read [[overview]] and [[active-work]], then [the CBM-01 spec](../docs/prd.md) and [workflow](../docs/design/cbm-01-workflow.md).

**Exact name: CBM-01, zero, no spaces.** The user invoked pick-up then vibe init for a cyberpunk rebrand and requested quick HTML options plus a saved merge workflow. v1.4.1 release work was already complete.

**In flight: ticket 01, visible identity cleanup.** Read `.claude/relay/cbm-01.traycer.json` before resuming; its `external_state` points to the active worktree's ticket checkpoint. The source [ticket](../docs/issues/01-cbm-01-identity.md) is the planning copy until integration. The relay controller is `befadc45-117d-4502-95c0-8f4f9efb1313`; do not start a duplicate while its worker is active.

**Visual choice remains open.** [Compare A/B/C](../docs/design/cbm-01-options.html). No palette is user-approved. Ticket 02 waits for the direction; identity work can proceed independently.

Keep fork work and baton commits on `modded` or its feature branch, never on the upstream tree mirror `main`. Preserve technical package/env/protocol/storage names, original notices, saved profiles, credential isolation, and working updater URLs. `.codeboarding/` remains user-owned. No release, package migration, or public issue publication is part of this local run.

## Related

- [[overview]]
- [[active-work]]
