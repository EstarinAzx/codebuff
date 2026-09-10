---
type: decision
project: CBM-01
updated: 2026-09-10
tags: [branding, compatibility, modded]
---

# CBM-01 identity and compatibility

**Superseded display name:** Current source uses RD-X-96 and primary command `rdx`, with `cbm` retained as an alias. [PRODUCT.md](../../PRODUCT.md) and [DESIGN.md](../../DESIGN.md) own the current contract. The original decision below describes the published CBM-01 v1.5.0 release.

**Decision:** The [request and correction](../../docs/design/cbm-01-request.md) establish the exact product name CBM-01. [The rebrand spec](../../docs/prd.md) owns the implementation boundary and deferred visual/distribution choices; do not duplicate them here.

**Why:** The user explicitly corrected the letter O to zero. Rebranding display copy must not strand existing installations or saved credentials. The independent pressure review accepted this boundary, but did not choose a visual direction on the user's behalf.

**Reversibility:** Display changes are local commits on a feature branch. A later package/storage migration requires its own compatibility plan. Existing notices remain intact.

## Related

- [[decisions]]
- [[overview]]
