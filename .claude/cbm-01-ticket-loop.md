# CBM-01 local ticket loop

This is the repository-specific body for the connected Traycer relay. Read `docs/design/cbm-01-workflow.md` and the assigned ticket before acting. It adapts preset ticket-loop to this fork's branch and local-only requirements.

1. Read the absolute relay control-state path supplied by the controller. Require `backend: traycer`, `stop: false`, and matching controller, worker ID, and leg. Never edit this control file.
2. Read the assigned ticket and its blockers. One ticket is the unit; the controller caps each worker at N=1. Check existing commits/checkpoint before editing to avoid replaying completed work.
3. Work only in the supplied isolated `feature/cbm-01` worktree. `main` remains the exact upstream tree mirror. Do not switch the user's primary checkout or modify `.codeboarding/`.
4. Use `traycer-implement`, the existing minimal-code rules, and appropriate tests. For this run, ticket 01 is identity-only. Do not select a palette or begin ticket 02 without a recorded user decision.
5. Run focused identity/affected behavior tests and typechecks. Build-smoke when the modified runtime graph warrants it. Preserve saved credentials, active provider, protocol names, original notices, and actual package/download identifiers. No live authentication or inference.
6. Commit the assigned ticket's implementation and its checkpoint on the feature branch. Record exact commands, outcomes, remaining exceptions, and any baseline limitations. Leave unrelated edits untouched. The controller refreshes `.context/` on `modded` so there is one baton writer.
7. Obtain the required independent code review, following the agent-selection guide. A child reviewer is allowed by the review skill; keep it read-only and report its findings/evidence. If review cannot run, report that limit instead of claiming review passed.
8. Reply to the controller's incoming request with run/leg, actual worker ID, completed unit count, outcome (`continue`, `done`, `blocked`, or `stale`), commit, tests, review, and ticket checkpoint path. A completed identity ticket with visual work still pending is `continue`, not whole-project `done`.
9. Stop after that report. The controller decides the next leg. When visual selection is the only blocker, the controller stops with `needs_visual_direction`; the redesign is not complete.

No remote push, PR, issue/comment publication, release, distribution migration, repository rename, or feature merge belongs to a worker in this run. Local integration is owned by ticket 03 after its prerequisites pass.
