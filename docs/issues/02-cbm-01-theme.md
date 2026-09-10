# 02: Apply Ghostline

**What to build:** The real CBM-01 terminal uses the selected direction's hierarchy, color roles, density, and focused interaction states while the existing coding workflow stays familiar.

**Blocked by:** 01 (complete). The user selected C: Ghostline; no remaining blocker.

**Status:** complete

- [x] Record the user's choice: "Use C: Ghostline for CBM-01."
- [x] Apply the direction through the existing theme/logo/layout seams, with a small reviewable diff.
- [x] Cover home, active output, provider/model controls, warnings/errors, and focused input.
- [x] Retain light mode, automatic theme detection, user overrides, terminal color fallbacks, and animation preference.
- [x] Verify representative wide, narrow, and short terminal states, with clear labels independent of color.
- [x] Run affected tests and typechecks; report what was and was not visually executed.

## Checkpoint

Integrated into `modded` by [ticket 03](03-cbm-01-integration.md). The implementation evidence below records leg 2 at its completion; integration is now complete.

Ghostline is approved. Follow [DESIGN.md](../../DESIGN.md), the [spec](../prd.md), and [workflow](../design/cbm-01-workflow.md). Preserve the selected ingredients: compact wordmark, single conversation column, quiet contextual status, violet focus/selection, and muted inactive chrome. Implement and verify the actual terminal, retaining light mode, terminal fallbacks, and user customization. This is relay leg 2; do not replay identity ticket 01 or perform integration ticket 03.

### Execution

Relay `cbm-01`, leg 2, worker `d87b0a31-ca74-4056-9c7e-e43706fc3edb`, base `ac6c5110aca0d21e00917dc654df2da951f961af`, branch `feature/cbm-01`. One theme unit completed and independently reviewed; outcome `continue`, because ticket 03 integration remains. The implementation and this checkpoint are committed together; the exact commit is supplied in the controller report. The coordinator owns integration and `.context`; no integration, push, release, live profile access, sign-in, or inference was performed.

The fork uses a single-line wordmark at all logo callers. The chat startup occupies two content rows instead of eight; its existing project link remains. Project-picker height allocation accounts for the one-row logo. The normal composer and collapsed mode control use three and one rows respectively. Existing transcript width, scrolling, status/stop actions, suggestions, mode controls, and keyboard handlers remain in place. `/providers` and `/model` continue rendering their real command results through conversation messages; there is no new provider panel or invented live indicator.

Ghostline colors use existing semantic roles; [DESIGN.md](../../DESIGN.md#implemented-terminal-values) owns the final token facts. Inactive mode and prose chrome is neutral, focused input and mode selection use violet, and selected-character text is opaque and contrasting. The terminal-background hook still owns the reported background, with a theme-correct opaque fallback. The static wordmark needs no decorative sheen timer; the Freebuff art, sheen behavior and existing cursor animation preference remain intact. No dependency, plugin, authentication or configuration framework was added.

### Verification

Commands ran with Bun 1.3.14. Test commands below run from `cli/` unless marked root. Raw test logs are in `debug/cbm-01/ghostline-*.log` (ignored local evidence).

| Check | Result |
| --- | --- |
| New Ghostline header/contrast regression before implementation | 0 passed, 2 failed: startup used eight occupied rows; an existing text/surface pair had 4.19:1 contrast. |
| `bun test src/__tests__/ghostline.test.tsx src/__tests__/unit/segmented-control.test.ts src/__tests__/unit/agent-mode-toggle.test.ts src/components/__tests__/chat-input-bar.test.tsx src/components/__tests__/multiline-input.test.tsx src/utils/__tests__/chat-input-key-intercept.test.ts src/utils/__tests__/theme-platform-detection.test.ts` | 104 passed, 0 failed; 297 assertions after review fixes. |
| `bun test src/__tests__/branding.test.tsx src/__tests__/cli-args.test.ts src/utils/__tests__/auth-oauth-preservation.test.ts src/utils/__tests__/chatgpt-oauth.test.ts src/utils/__tests__/grok-provider.test.ts src/utils/__tests__/providers.test.ts src/utils/__tests__/providers-models.test.ts src/utils/__tests__/providers-models-codex.test.ts` | 83 passed, 0 failed; 350 assertions. |
| `FREEBUFF_MODE=true bun test src/__tests__/branding.test.tsx src/__tests__/ghostline.test.tsx src/__tests__/cli-args.test.ts src/__tests__/unit/segmented-control.test.ts src/components/__tests__/chat-input-bar.test.tsx` | 33 passed, 0 failed, 4 Ghostline-only cases skipped; 125 assertions. Environment flag was process-local. |
| `bun test src/__tests__/ghostline.test.tsx src/components/ask-user/__tests__/multiple-choice-form.test.ts src/components/ask-user/__tests__/validation.test.ts src/components/__tests__/ad-banner.test.tsx src/components/__tests__/dock-ad-banner.test.tsx src/components/__tests__/message-with-agents.test.tsx` | 122 passed, 0 failed; 435 assertions. With process-local `FREEBUFF_MODE=true`: 118 passed, 0 failed, 4 Ghostline cases skipped; 269 assertions. |
| Root: `bun test ./cli/src/components/__tests__/message-block.streaming.test.tsx ./cli/src/components/__tests__/message-block.completion.test.tsx ./cli/src/components/__tests__/message-with-agents.test.tsx` | 27 passed, 0 failed; 63 assertions. |
| Root: `bun run --cwd cli typecheck` | Passed, exit 0. PowerShell's redirected log labels Bun's ordinary stderr command echo as NativeCommandError; there were no TypeScript diagnostics. |
| Root: `bun cli/scripts/build-binary.ts codebuff-mod 1.4.1` | Passed; `cli/bin/codebuff-mod.exe --help` and `--version` exit 0, display `Usage: cbm`, `CBM-01 CLI`, and `1.4.1`. |
| Root: `bun freebuff/cli/build.ts 0.0.0-dev` | Passed; `cli/bin/freebuff.exe --help` and `--version` exit 0, display `Usage: freebuff`, Freebuff identity, and `0.0.0-dev`. |
| `git diff --check` | Passed. |

Builds used the existing process-local `NODE_EXTRA_CA_CERTS=C:/Users/S.D/AppData/Local/Temp/codebuff-windows-trust.pem`. Build logs: `C:/Users/S.D/.traycer/commands/534ebcad-526b-42d9-a142-dfd98ca72ffd/5aab72fa-2784-4393-9f97-a02544c28074/output.log` and sibling shell `997392d6-5d3f-42ee-a575-940e119672f2/output.log`.

### Rendered evidence and limits

Review-driven verification also covers actual focused question choices and descriptions, Custom labels, ad action labels, and agent titles on their filled backgrounds in dark/light. It initially failed on a 1.56:1 agent title pair. The corrected labels use a contrasting foreground; agent headers now use the existing quiet header/expanded surface tokens. Evidence: `dark-80x22-filled-controls.svg` and `light-80x22-filled-controls.svg`, with matching `.txt`/`.png`. Both Windows builds and the CLI typecheck were repeated after these fixes.

The expanded Freebuff suite exposed a pre-existing test mismatch: the message test expected `Edit Mode`, although Freebuff's `ModeDivider` intentionally returns `null`. The same assertion failed at `ac6c5110aca0d21e00917dc654df2da951f961af` in a temporary detached worktree using the same dependencies. Evidence: `debug/cbm-01/ghostline-baseline-mode-divider.log`. The test now checks each product's existing behavior; no divider behavior changed. The temporary worktree and dependency junction were removed. The final suite above passes without waiving that failure.

`GHOSTLINE_FRAMES=../debug/cbm-01/ghostline bun test src/__tests__/ghostline.test.tsx` exports actual OpenTUI `captureCharFrame` text and `captureSpans`-derived colored SVG files. The fixture composes production `ChatHeader`, `MessageWithAgents`, `StatusBar`, and `ChatInputBar` with the chat's existing transcript/dock gutters and controlled data. It does not boot the app or read a real profile. Dark/light at 120×32, 40×24, and 80×12 cover empty, active tool/output, provider/model messages and suggestions, input, semantic feedback, character selection, cleared text, and unfocused input. Ctrl-A/Ctrl-K exercises the real input handler and asserts the placeholder reappears after clearing.

Evidence directory: `C:/Users/S.D/.traycer/worktrees/estarinazx__codebuff-modded/feature-cbm-01/debug/cbm-01/ghostline/`. Representative files: `dark-120x32-active.svg`, `light-40x24-providers.svg`, `dark-80x12-active.svg`, `light-40x24-feedback.svg`, `light-40x24-selection.svg`, and `light-120x32-unfocused.svg`. All have matching `.txt` captures. PNG derivatives use the same cell positions/colors with local Consolas; that font lacks some cursor/copy glyphs, so the source SVG/text remain authoritative.

Visual inspection confirmed compact identity, readable narrow labels, quiet prose borders, selected menu treatment, and usable short-terminal input/stop controls. Short active transcripts scroll the header and older output out of view as before. The existing error panel inside a prose frame is retained. The browser navigation attempt to view an exported frame timed out; images were inspected locally instead. `tmux` is unavailable, so full live interactive CLI acceptance, real terminal font rendering and physical limited-color hardware were not verified. Limited-color fallback selection is subprocess-tested. No baseline runtime schema failures were rerun or counted as passing for this ticket.

### Independent review

Read-only reviewer `cadbfdb1-b186-4aa0-bdce-54be0a92e690`, Codex / GPT-6 Astra / high / full_access, approved after the P2 light-theme inverse-label finding was fixed. No open actionable findings. The reviewer independently checked every reported primary-filled caller, all three ad hover actions in both themes, both agent-header states, and the Freebuff divider-test correction. Final reviewer checks: Ghostline 5 passed / 168 assertions; affected ask-user/ad/message 93 passed; combined Freebuff 94 passed / 4 expected skips, zero failures. The reviewer did not independently rebuild the binaries or perform live terminal acceptance.

Review artifact: `C:/Users/S.D/.traycer/epics/534ebcad-526b-42d9-a142-dfd98ca72ffd/artifacts/cbm-01-ghostline-review/index.md`.
