# RD-X-96: reference palette

The user supplied a hot-pink/cyan interface as the color reference, then clarified: “dont need a background”. This supersedes Ghostline's violet colors. Retain the existing Ghostline layout, animated RD-X-96 banner and responsive fallbacks.

## Purpose and scene

A developer reads coding output in their own terminal. Use hot pink for identity and headings, cyan for reply frames and code references, and light-gray body text. The terminal owns the canvas; no background image or forced opaque app background is added. Keep automatic and light themes.

## Visual contract

| Role | Implementation |
| --- | --- |
| Identity and focus | Hot-pink banner sheen, compact wordmark, focused input and primary actions |
| Reading accents | Cyan assistant reply border, user/agent markers, links, inline code and list bullets |
| Prose | Light-gray body text and quieter gray secondary text |
| Layout | Existing single reading column, compact composer and measured full/small/text banner fallbacks; the large banner has no duplicate small text label |
| Motion | Existing shimmer and animation/visibility preferences |
| Canvas | Transparent; preserve the input's existing terminal-background repaint behavior |

## Terminal palette

The supplied image guides the hue relationships rather than an exact pixel match. OpenTUI receives supported sRGB hex values. Light mode uses darker pink and cyan to retain readable contrast.

| Role | Dark | Light |
| --- | --- |
| Primary / headings | `#ff0055` | `#b8003f` |
| Cyan / reply frame / links / inline code | `#00d7e5` | `#006b75` |
| Foreground | `#cbd1d7` | `#20262d` |
| Muted text | `#8a949e` | `#53616d` |
| Existing opaque repaint fallback | `#0b0d13` | `#f7f8fc` |
| Existing control/code surface | `#13161d` | `#eceef5` |
| Selection surface | `#14171c` | `#dfe5eb` |
| Decorative divider | `#2f333d` | `#c9cbd5` |
| Actionable inactive border | `#626575` | `#767987` |

Keep labeled warning/error/success colors. Body text, accents and semantic feedback must maintain at least 4.5:1 contrast on base, control and selected surfaces. The actual reply border must maintain at least 3:1 against the fallback base. Limited-color logo/cursor fallbacks are `red` in dark mode and `maroon` in light mode. User overrides still apply through the existing theme builder; Freebuff retains its own palette.

The transparent canvas and reported terminal-background input fill are unchanged. The opaque fallback above is only for surfaces that already require repainting to erase stale text, not a new app-wide background.

## Evidence and scope

Use real OpenTUI frames at wide, narrow and short sizes in both themes. Verify heading, inline-code and reply-border colors, text contrast, selected input, menus, banner animation and fallback behavior. Preserve keyboard operation, provider/auth state and the separate Freebuff build.

The user's image is the color reference; its wording and layout are not product requirements. The original Ghostline selection remains recorded in [the request history](docs/design/cbm-01-request.md). No new image-generation probe is needed and no gauntlet bar is implied.
