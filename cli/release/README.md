# RD-X-96

RD-X-96 is a standalone coding assistant for your terminal. Connect your own API-key or subscription provider and work with your chosen model.

Fork source: https://github.com/EstarinAzx/codebuff-modded

## Installation

```bash
npm install -g codebuff-mod
```

(Use `sudo` if you get a permission error.)

## Quick start

```bash
cd ~/my-project
rdx           # aliases: cbm, codebuff-mod
```

Inside the CLI:

```
/providers:add <preset> <profile-name> <apiKey>
```

Presets:

| Preset | Default model | Notes |
|---|---|---|
| `openai` | gpt-5.1 | api.openai.com |
| `anthropic` | claude-sonnet-4.5 | api.anthropic.com |
| `openrouter` | anthropic/claude-sonnet-4.5 | openrouter.ai |
| `opencode` | minimax-m2.7 | opencode.ai/zen/v1 |
| `opencode-go` | glm-5 | opencode.ai/zen/go/v1 |
| `deepseek` | deepseek-chat | api.deepseek.com |
| `gemini` | gemini-2.5-pro | generativelanguage.googleapis.com |
| `mistral` | mistral-large-latest | api.mistral.ai |
| `together` | meta-llama/Llama-3.3-70B-Instruct-Turbo | api.together.xyz |
| `groq` | llama-3.3-70b-versatile | api.groq.com |
| `grok` | grok-4.6 | SuperGrok subscription; `/providers:add grok [name]`, no API key |
| `codex` | Account model catalog | ChatGPT subscription; `/providers:add codex [name]`, no API key |
| `custom-openai` | (yours) | Any OpenAI-compatible endpoint — needs `<baseUrl>` arg |

Then run any coding task. RD-X-96 uses the model from your active profile and sends requests directly to your provider.

### Web search, browser and desktop control

A saved Codex profile supplies web search and source URLs without another search-service API key. Your main model can remain Grok or another provider. Search uses the Codex plan's allowance; the active Codex profile is preferred, otherwise the first configured Codex profile is used.

`/browser on` enables local browser control. It requires Node.js 22.15+ and Microsoft Edge on Windows or Google Chrome on Linux. `/computer on` enables Windows desktop control and requires `uv`; Python 3.13 and the pinned server are downloaded when needed. Both features start disabled and need no service API key. First setup needs internet.

Use `/browser` or `/computer` for status, and `/browser off` or `/computer off` to interrupt the active run and close that connector. Enabled tools act with your user access without per-action confirmation. Managed browser and desktop tools are excluded from PLAN mode. Existing provider profiles and user-defined MCP configuration are preserved.

This release ships Windows x64, Linux x64 and Linux arm64 binaries. See [tool documentation](https://github.com/EstarinAzx/codebuff-modded/blob/modded/docs/computer-tools.md) for supported actions, dependency versions and configuration.

### Grok subscription login

Run `/providers:add grok` (or `/providers:add grok Work` for a named account). Open the displayed xAI verification link, enter the code and approve. The CLI activates the profile after authorization succeeds; a denied or expired login leaves your current provider selected.

Grok uses xAI's subscription proxy and the Responses API. Run `/model` for live account model discovery, `/model <id>` to switch, or `/providers:refresh-models` to refresh the five-minute cache. Offline lists are labeled. Tokens refresh automatically and are stored separately per profile in `~/.config/manicode/grok-oauth.json`; removing a Grok profile removes its stored tokens. `/providers:test` checks Grok authentication and catalog access without generating a paid request.

The integration follows the device-code protocol inspected in [pi-grok](https://github.com/stnly/pi-grok/tree/8b304e65c088f84ccb932959d97739245fe47d97). It does not change your xAI account's privacy settings.

## Commands

| Command | What it does |
|---|---|
| `/providers` | List your profiles (`*` marks active) |
| `/providers:add <preset> <name> <apiKey>` | Add a new profile, set active |
| `/providers:select <id\|name>` | Switch active profile |
| `/providers:remove <id\|name>` | Remove a profile |
| `/providers:test` | Check the active provider (Grok: authentication/catalog; API-key providers: 1-token ping) |
| `/providers:refresh-models` | Clear the active profile's models cache (OAuth: 5 minutes; other providers: 24 hours) |
| `/model` | Show current model + live-probe available ids |
| `/model <id>` | Swap model on the active profile |
| `/browser [on\|off\|status]` | Enable, stop or inspect local browser control |
| `/computer [on\|off\|status]` | Enable, stop or inspect Windows desktop control |
| `/mode:default` `/mode:lite` `/mode:max` `/mode:plan` | Switch agent mode (mod-* templates in `.agents/`) |

Your profiles live at `~/.config/manicode/providers.json` (chmod 0600). API keys are masked in all log output.

## Knowledge files

Add a `knowledge.md` anywhere in your project to give the agent persistent context. The agent reads + writes them as it works.

## Troubleshooting

### Permission errors during install

```bash
sudo npm install -g codebuff-mod
```

If still broken, [reinstall Node](https://nodejs.org/en/download).

### Binary download fails

The launcher fetches the platform binary from GitHub Releases of `EstarinAzx/codebuff-modded` on first run. If you're behind a proxy, set `HTTPS_PROXY`:

```bash
export HTTPS_PROXY=http://your-proxy-server:port   # bash/zsh
$env:HTTPS_PROXY = "http://your-proxy-server:port" # PowerShell
set HTTPS_PROXY=http://your-proxy-server:port      # CMD
```

Also supported: `HTTP_PROXY`, `NO_PROXY` (with comma-separated hostnames). URL-embedded credentials work (`http://user:pw@proxy:port`).

### "No active BYOK profile and no Codebuff backend configured"

You haven't added a provider profile yet. Run `/providers:add` (see above).

### Override binary download URL (testing)

```bash
export CODEBUFF_MOD_RELEASE_URL=https://example.com/codebuff-mod-linux-x64.tar.gz
```

### Use the legacy Codebuff backend instead (advanced)

```bash
export CODEBUFF_USE_BACKEND=1
export NEXT_PUBLIC_CODEBUFF_APP_URL=https://codebuff.com
```

This restores the upstream behavior (requires a real codebuff.com account + API key).

## License

MIT. Built on top of [Codebuff](https://github.com/CodebuffAI/codebuff) (Apache-2.0).

## Issues

https://github.com/EstarinAzx/codebuff-modded/issues
