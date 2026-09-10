# CBM-01: Ghostline

Selected by the user on 2026-09-10: "Use C: Ghostline for CBM-01." The reference is option C in [the HTML comparison](docs/design/cbm-01-options.html). This is an approved direction; concrete terminal color values and cell spacing are implementation choices subject to verification.

## Purpose and scene

The developer is focused on a coding task in a terminal. The selected dark reference uses quiet violet on dim neutral surfaces; the existing light theme remains available for bright environments and the user's automatic theme preference. The primary action is entering a task and inspecting its output.

## Visual contract

| Ingredient from option C | Terminal implementation |
| --- | --- |
| Compact CBM-01 wordmark | Use the existing text-logo path or a small text header instead of a tall startup banner; preserve usable project/login states |
| One reading column | Keep output and input aligned; use the existing content-width/layout behavior; no new side rail |
| Thin contextual status row | Keep real project/provider/model/mode information in existing compact status/header affordances; wrap or shorten secondary text on narrow terminals |
| Quiet violet identity | Use violet for primary focus/selection/identity, neutral inactive surfaces, and labeled semantic warning/error/success colors |
| Restrained borders | Reduce decorative contrast in conversation/input chrome without hiding focus, selection, or actionable boundaries |
| Calm rhythm | Reduce wasted startup rows and let output lead; preserve existing motion preference and keyboard behavior |

The browser's display-font sizing and pixel padding translate into terminal cells and emphasis, not new fonts or a browser shell. Its profiles and status labels are sample content, not permission to add a new provider or fake live indicators. No images, gradients, blur, or decorative animation are required.

## Color anchor

The selected HTML uses these OKLCH roles: accent `82% 0.105 295`, foreground `95% 0.01 270`, muted `74% 0.02 270`, base `16% 0.012 270`, surface `20% 0.016 270`, border `32% 0.019 270`, secondary accent `87% 0.05 230`. Convert to the terminal's supported color representation, rather than passing unsupported CSS color strings.

Keep a contrasting violet light-theme counterpart, terminal color fallbacks, and user overrides. Preserve the existing terminal-background integration and opaque repaint behavior where required to avoid stale text. Check actual foreground/background pairs; the preview's decorative border contrast is not an accessibility target for focus or input controls.

### Implemented terminal values

The dark anchors are converted from OKLCH to sRGB, clipped to the sRGB gamut and rounded to 8-bit channels. In particular, the accent's blue channel reaches the gamut boundary. OpenTUI receives supported hex values, not CSS OKLCH strings.

| Role | Dark | Light |
| --- | --- | --- |
| Focus / identity | `#c9b7ff` | `#644b9e` |
| Foreground | `#eceef5` | `#1f2129` |
| Muted text | `#a6abb8` | `#545864` |
| Opaque base fallback | `#0b0d13` | `#f7f8fc` |
| Surface | `#13161d` | `#eceef5` |
| Selection surface | `#30283e` | `#dfdbed` |
| Decorative divider / prose frame | `#2f333d` | `#c9cbd5` |
| Actionable inactive border | `#626575` | `#767987` |

The canvas remains terminal-transparent. The input uses the reported terminal background when available, otherwise the opaque base above; this retains repainting of cleared text. Character selection uses the accent as background and the opaque base as foreground. Label text, muted text, accents and semantic feedback are checked against base, surface and selected surfaces at 4.5:1 or better. Actual captured selected-character foreground/background pairs are checked too. Limited-color cursor fallbacks are `fuchsia` in dark mode and `purple` in light mode; OpenTUI continues handling terminal color capability negotiation. Freebuff keeps its existing palette and fallbacks. User color overrides still apply through the existing theme builder.

## States and scope

Apply this to the actual CBM-01 home/start screen, active conversation and tools, focused/unfocused input, provider/model controls, and warning/error/success messages. Keep the separate Freebuff build's identity and theme behavior. No provider/auth changes belong here.

Check dark and light, truecolor and fallback, wide and narrow, short height, empty and active output, and a long project/model label. Preserve input navigation, interruption, menus, and status meaning. Reuse the existing semantic theme and logo seams before adding fields or components.

## Evidence

Use real OpenTUI renderer frames and relevant existing tests. Capture inspectable representative terminal frames with color where the tooling supports it; a hand-drawn HTML page alone does not verify the terminal implementation. Record any inability to run an interactive terminal rather than claiming it passed.

No new raster-probe round is needed: the user already selected the supplied HTML direction. This approval does not create a gauntlet bar.
