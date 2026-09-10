# CBM-01

CBM-01 is the standalone coding-agent fork on `modded`. Launch it with `cbm`. Preserve the existing package and provider compatibility while changing product display branding.

## Key Technologies

- TypeScript monorepo
- Bun runtime and package manager
- OpenTUI + React CLI
- JS/TS SDK
- Composable agent runtime

## Repo Map

- `cli/` - TUI client and local UX
- `sdk/` - JS/TS SDK used by the CLI and external users
- `common/` - shared types, tools, schemas, and utilities
- `agents/` - public agent definitions
- `packages/agent-runtime/` - agent runtime and tool handling
- `packages/code-map/` - source parsing helpers
- `packages/llm-providers/` - public LLM provider shims
- `freebuff/` - Freebuff CLI, release files, and e2e tests
- `scripts/tmux/` - tmux helpers for CLI testing

## Conventions

- Use `bun install` and `bun run`.
- Prefer dependency injection over module mocking.
- Run interactive CLI tests in tmux.
- Do not force-push `main`.

## Docs

- `docs/agents-and-tools.md`
- `docs/testing.md`

## Agent skills

For the CBM-01 rebrand, read `docs/prd.md` and `docs/design/cbm-01-workflow.md`. Read `MERGE-STRATEGY.md` before integration or upstream sync; `main` remains the upstream tree mirror and fork work belongs on `modded`.

### Issue tracker

The current local queue is in `docs/issues/`; see `docs/agents/issue-tracker.md`.

### Triage labels

Use the canonical roles in `docs/agents/triage-labels.md`.

### Domain docs

Read existing domain context according to `docs/agents/domain.md`.
