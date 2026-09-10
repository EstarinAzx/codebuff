# 03: Verify integration and preserve the fork through merges

**What to build:** A reviewed local CBM-01 build can be integrated into modded, and future upstream syncs retain the branding, terminal behavior, and existing provider guarantees.

**Blocked by:** 01 and 02.

**Status:** blocked

- [ ] Independently review the complete diff and resolve actionable findings.
- [ ] Run targeted identity/theme/provider regressions and affected package typechecks.
- [ ] Build and smoke the local binary, recording the exact commands and limitations.
- [ ] Update the merge conflict map with the actual final brand/theme seams and checks.
- [ ] Integrate the verified feature branch into modded as one revertible merge; main remains an upstream tree mirror.
- [ ] Refresh the baton with the final state, remaining compatibility exceptions, and next action.
- [ ] Leave publication, distribution renaming, and any version decision for a separate explicit request.

## Checkpoint

Not started. Follow the [spec](../prd.md) and [workflow](../design/cbm-01-workflow.md).
