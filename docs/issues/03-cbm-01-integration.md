# 03: Verify integration and preserve the fork through merges

**What to build:** A reviewed local CBM-01 build can be integrated into modded, and future upstream syncs retain the branding, terminal behavior, and existing provider guarantees.

**Blocked by:** 01 and 02 (both verified complete on feature/cbm-01).

**Status:** ready-for-agent

- [ ] Independently review the complete diff and resolve actionable findings.
- [ ] Run targeted identity/theme/provider regressions and affected package typechecks.
- [ ] Build and smoke the local binary, recording the exact commands and limitations.
- [ ] Update the merge conflict map with the actual final brand/theme seams and checks.
- [ ] Integrate the verified feature branch into modded as one revertible merge; main remains an upstream tree mirror.
- [ ] Refresh the baton with the final state, remaining compatibility exceptions, and next action.
- [ ] Leave publication, distribution renaming, and any version decision for a separate explicit request.

## Checkpoint

Ready for the final gate. Identity and Ghostline are verified through `b8e37262f`; exact commands and limitations are in tickets 01 and 02. Follow the [spec](../prd.md) and [workflow](../design/cbm-01-workflow.md).

This ticket may perform local integration only when the controller's brief explicitly grants the source checkout. Inspect the complete code diff and existing review artifacts, verify the combined candidate, then merge `feature/cbm-01` into `modded` with `--no-ff`. Keep `main` unchanged. Preserve the user's untracked `.codeboarding/`; stop on unexpected changes rather than stashing or discarding them. Commit final ticket evidence on `modded`; the controller writes `.context/` and relay state. No push, publication, global installation, release version change, or live authentication.
