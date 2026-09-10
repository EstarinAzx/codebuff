# 02: Apply Ghostline

**What to build:** The real CBM-01 terminal uses the selected direction's hierarchy, color roles, density, and focused interaction states while the existing coding workflow stays familiar.

**Blocked by:** 01 (complete). The user selected C: Ghostline; no remaining blocker.

**Status:** ready-for-agent

- [x] Record the user's choice: "Use C: Ghostline for CBM-01."
- [ ] Apply the direction through the existing theme/logo/layout seams, with a small reviewable diff.
- [ ] Cover home, active output, provider/model controls, warnings/errors, and focused input.
- [ ] Retain light mode, automatic theme detection, user overrides, terminal color fallbacks, and animation preference.
- [ ] Verify representative wide, narrow, and short terminal states, with clear labels independent of color.
- [ ] Run affected tests and typechecks; report what was and was not visually executed.

## Checkpoint

Ghostline is approved. Follow [DESIGN.md](../../DESIGN.md), the [spec](../prd.md), and [workflow](../design/cbm-01-workflow.md). Preserve the selected ingredients: compact wordmark, single conversation column, quiet contextual status, violet focus/selection, and muted inactive chrome. Implement and verify the actual terminal, retaining light mode, terminal fallbacks, and user customization. This is relay leg 2; do not replay identity ticket 01 or perform integration ticket 03.
