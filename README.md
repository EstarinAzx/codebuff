# RD-X-96

RD-X-96 is a standalone coding assistant for your terminal. Connect an API-key or subscription provider, then ask it to read, edit, and verify code in your project.

The display name is **RD-X-96** (no spaces). The package remains `codebuff-mod`; launch with `rdx`. Existing `cbm` and `codebuff-mod` commands remain aliases.

## Install and start

```sh
npm install -g codebuff-mod
cd your-project
rdx
```

Inside the CLI, add an API-key provider with `/providers:add <preset> <apiKey>`, or use `/providers:add codex` or `/providers:add grok` for subscription OAuth. Use `/model` to select a model. Existing profiles, credentials, bindings, and commands are preserved.

See the [launcher guide](cli/release/README.md) for provider setup, commands, and troubleshooting. Downloads continue to use [the fork's existing releases](https://github.com/EstarinAzx/codebuff-modded/releases).

## Development

Use Bun 1.3.14:

```sh
bun install
bun run dev
```

- [Testing](docs/testing.md)
- [Agents and tools](docs/agents-and-tools.md)
- [Rebrand scope](docs/prd.md) and [work queue](docs/prd.md#work-queue)
- [Upstream merge strategy](MERGE-STRATEGY.md)

RD-X-96 uses the user-selected Ghostline terminal design, with existing provider and distribution compatibility retained.

## Upstream projects and attribution

This repository retains Codebuff's SDK, runtime, package identifiers, and original notices. See [LICENSE](LICENSE) and [NOTICE](NOTICE). [Codebuff documentation](https://codebuff.com/docs) describes the upstream framework and SDK.

[Freebuff](https://freebuff.com) remains a separate product in `freebuff/`; its build mode and identity are preserved. Freebuff's hosted offerings and account policies do not describe this standalone fork.
