# Local browser and Windows desktop tools

RD-X-96 can control a separate browser and the current Windows desktop through local MCP servers. These tools work with the selected model, including Grok; they do not require another service API key or change your provider. Both connectors start disabled.

## Web search with an existing subscription

When a Codex profile is saved in RD-X-96, `web_search` uses that subscription and returns source URLs to the selected model. Grok can remain the main model. The active Codex profile is preferred; otherwise the first configured Codex profile supplies search. This uses the Codex plan's allowance, with no separate search-service key.

DEFAULT and LITE support direct search and source-page reading; DEFAULT can also delegate to the web researcher. Existing keyed search providers remain available when no Codex search profile is configured. A selected Codex profile's sign-in, access or quota error is reported rather than silently switching to another billed service. Reconnect through `/providers:add codex` when necessary.

The direct Codex subscription endpoint is a compatibility integration verified against the current saved account/model. It is not a promise that every account or future model supports hosted search. The browser and desktop connectors below are separate local tools.

## Commands

| Command                           | Behavior                                                                                                                           |
| --------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| `/browser on`                     | Check prerequisites, download the pinned server if necessary, discover its tools, and enable browser control for the next message. |
| `/computer on`                    | Do the same for the current Windows desktop.                                                                                       |
| `/browser` or `/browser status`   | Report the setting and check discovery when enabled.                                                                               |
| `/computer` or `/computer status` | Report the desktop setting and check discovery when enabled.                                                                       |
| `/browser off` or `/computer off` | Save the disabled setting, interrupt the active run, and close the matching built-in server.                                       |

Enabling a connector grants actions with your user access **without per-action confirmation**. Desktop access includes the apps and documents visible in your session. Browser access includes navigation, typing, clicking, uploads and screenshots. Use these tools only for tasks you intend to authorize. Turning a connector off cannot undo an action already performed. A late first-run installation cannot re-enable a connector after `/off`.

The commands appear in RD-X-96 on supported platforms; they are not added to Freebuff. Browser control supports Windows, macOS and Linux. Desktop control is Windows only.

## Prerequisites and setup

- Browser: Node.js 22.15+ with `npx`, plus Microsoft Edge in its standard Windows location or Google Chrome on macOS/Linux. Linux needs a working graphical session; its display environment is forwarded. First use requires internet to download the server. No extension or remote-debugging setup is needed.
- Desktop: an unlocked, interactive Windows desktop and [uv](https://docs.astral.sh/uv/getting-started/installation/). `uvx` downloads Python 3.13 and the pinned package when necessary. English Windows is preferred by upstream for app-name lookup. Protected/elevated windows may reject control from a normal user process.

Setup checks tool discovery without opening a page or capturing the desktop. “Ready” means the server responded with tools; it does not prove every target app can be automated. A missing executable, startup error, failed download or failed discovery is reported by the command. First installation can exceed the MCP handshake timeout; after downloads complete, retry `/browser on` or `/computer on`. An existing enabled setting remains enabled if a later readiness check fails, with the failure reported explicitly.

Playwright uses an isolated temporary profile, with the Chromium sandbox enabled and image responses explicitly allowed. It does not connect to an existing Chrome/Edge profile, import cookies, or alter the Traycer browser. Login state in that temporary profile is discarded when its browser closes. To use a different browser or a deliberately persistent profile, configure your own MCP server instead.

Settings live at `~/.config/rdx/computer-tools.json`:

```json
{
  "browser": false,
  "computer": false
}
```

Windows-MCP receives an explicit `~/.config/rdx/windows-mcp.toml`, created with empty defaults on first enable. This avoids reading its separate `~/.windows-mcp/config.toml`. Existing product settings and unknown JSON fields are preserved; malformed settings are reported rather than replaced. Package downloads use the package managers' ordinary per-user caches. There is no global package install, scheduled task or system service.

Browser captures and logs go to `browser-output` beside the settings file (`~/.config/rdx/browser-output` by default), keeping Playwright output out of project checkouts. Task-specific settings paths keep browser output beside those task settings instead.

Shared `.agents/mcp.json`, Claude/Codex settings, provider credentials and authentication settings are unchanged. Built-in server names are `rdx-browser` and `rdx-computer`. If a name already belongs to user configuration or an agent, the built-in is skipped and the command explains the collision. `/off` leaves that user-owned server untouched; disable it in its own configuration if desired.

## Runtime and access boundaries

Enabled entries join the existing MCP configuration on the fork's DEFAULT, LITE and MAX roots and upstream `base*` roots, except `base2-plan`. Managed browser and desktop tools are excluded from PLAN to preserve its read-only promise. Explicit user MCP configuration keeps its existing behavior. Existing agent-specific browser tool allowlists are preserved. Servers start lazily when needed, or during an explicit `/on`/enabled-status check. Existing user MCP entries keep precedence.

The managed browser advertises the pinned browser automation tools through the existing per-server tool allowlist, excluding upstream's `browser_run_code_unsafe` host-code tool. The managed desktop server exposes only `App`, `DisplayInventory`, `Snapshot`, `Screenshot`, `Click`, `Type`, `Scroll`, `Move`, `Shortcut`, `Wait`, `WaitFor`, `MultiSelect` and `MultiEdit`. Its independent PowerShell, Registry, FileSystem, Process, Clipboard, Scrape and Notification tools are not enabled. These choices reduce the exposed tool surface; UI automation is still powerful and is not a security sandbox.

Registered MCP tools use the existing MCP dispatch path, not terminal-command approval. The explicit `/on` switch is the access opt-in. Service API credentials are not added to subprocess environments; MCP inherits its standard safe environment plus the connector's explicit settings. Windows-MCP telemetry and its optional focus watchdog are disabled. Web pages, app text and tool output remain untrusted task evidence.

The browser launcher sets `NODE_OPTIONS=--use-system-ca` locally, retaining certificate verification while using the OS trust store, and forwards `NODE_EXTRA_CA_CERTS` if already configured. This prevents npm certificate retries from consuming the MCP startup timeout on machines with locally trusted certificates. The [Node CLI documentation](https://nodejs.org/docs/latest-v22.x/api/cli.html#--use-system-ca) dates this flag to Node 22.15.0. Pinned cached packages use `--prefer-offline`; a first download still needs working TLS and internet. No global Node/npm configuration is changed.

MCP image content is retained as media, then converted to an image-bearing user message after the tool result. OpenAI-compatible and Grok/Responses conversion preserve the image. The selected provider/model must support images to reason from screenshots; both servers also offer structured text snapshots. No SDK import alone grants desktop control.

## Pins and license notices

Verified against upstream documentation, package metadata and local MCP discovery on 2026-09-11:

| Server         | Pin                      | Upstream and license                                                                                                                                                     |
| -------------- | ------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Playwright MCP | `@playwright/mcp@0.0.80` | [Microsoft repository](https://github.com/microsoft/playwright-mcp), [release](https://github.com/microsoft/playwright-mcp/releases/tag/v0.0.80), Apache-2.0             |
| Windows-MCP    | `windows-mcp==0.8.5`     | [CursorTouch repository](https://github.com/CursorTouch/Windows-MCP), [PyPI package](https://pypi.org/project/windows-mcp/0.8.5/), MIT; copyright (c) 2025 JEOMON GEORGE |

These are separately downloaded upstream packages, not vendored source. Their distributed license/notice files remain intact. If packaging these servers into a future release, include their licenses and applicable dependency notices. Do not silently move these pins to `latest`; verify CLI flags, tools, platform requirements and licenses when updating.
