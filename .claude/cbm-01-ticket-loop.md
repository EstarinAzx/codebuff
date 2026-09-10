# CBM-01 local ticket loop

This is the repository-specific body for the connected Traycer relay. Read `docs/design/cbm-01-workflow.md` and the assigned ticket before acting. It adapts preset ticket-loop to this fork's branch and local-only requirements.

1. Read the absolute relay control-state path supplied by the controller. Require `backend: traycer`, `stop: false`, and matching controller, worker ID, and leg. Never edit this control file.
2. Read the assigned ticket and its blockers. One ticket is the unit; the controller caps each worker at N=1. Check existing commits/checkpoint before editing to avoid replaying completed work.
3. Implementation tickets work only in the supplied isolated `feature/cbm-01` worktree. Ticket 03 may additionally use the source `modded` checkout for its verified local merge when the controller explicitly supplies that workspace. `main` remains the exact upstream tree mirror. Preserve `.codeboarding/` and all unrelated changes.
4. Use `traycer-implement`, the existing minimal-code rules, and appropriate tests. Ticket 01 is identity-only. The user selected C: Ghostline for ticket 02; apply the approved `DESIGN.md` to that ticket. Stay within the assigned ticket.
5. Run focused identity/affected behavior tests and typechecks. Build-smoke when the modified runtime graph warrants it. Preserve saved credentials, active provider, protocol names, original notices, and actual package/download identifiers. No live authentication or inference.
6. Commit implementation/checkpoints on the feature branch. Ticket 03 records the completed local merge and its evidence on `modded` after the merge. Record exact commands, outcomes, remaining exceptions, and baseline limitations. Leave unrelated edits untouched. The controller alone refreshes `.context/` and relay state.
7. Obtain the required independent code review, following the agent-selection guide. A child reviewer is allowed by the review skill; keep it read-only and report its findings/evidence. If review cannot run, report that limit instead of claiming review passed.
8. Reply to the controller's incoming request with run/leg, actual worker ID, completed unit count, outcome (`continue`, `done`, `blocked`, or `stale`), commit, tests, review, and ticket checkpoint path. Completing ticket 01 or 02 while integration remains pending is `continue`, not whole-project `done`.
9. Stop after that report. The controller decides the next leg. When visual selection is the only blocker, the controller stops with `needs_visual_direction`; the redesign is not complete.

No remote push, PR, issue/comment publication, release, distribution migration, repository rename, or global installation belongs to a worker in this run. Only the explicitly authorized ticket-03 integrator may perform the verified local feature merge after its prerequisites pass.
