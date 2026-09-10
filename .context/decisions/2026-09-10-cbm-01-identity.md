---
type: decision
project: CBM-01
updated: 2026-09-10
tags: [branding, compatibility, modded]
---

# CBM-01 identity and compatibility

**Decision:** The [request and correction](../../docs/design/cbm-01-request.md) establish the exact product name CBM-01. [The rebrand spec](../../docs/prd.md) owns the implementation boundary and deferred visual/distribution choices; do not duplicate them here.

**Why:** The user explicitly corrected the letter O to zero. Rebranding display copy must not strand existing installations or saved credentials. The independent pressure review accepted this boundary, but did not choose a visual direction on the user's behalf.

**Reversibility:** Display changes are local commits on a feature branch. A later package/storage migration requires its own compatibility plan. Existing notices remain intact.

## Related

- [[decisions]]
- [[overview]]
