# 01: Rebrand the complete visible CLI path

**What to build:** Launching the fork, asking for help, working on a task, and exporting a conversation consistently identify the product as CBM-01.

**Blocked by:** None; can start immediately.

**Status:** complete

- [x] The exact name is CBM-01, zero, no spaces.
- [x] Header, full/small/text logos, window title, startup/help, warnings, conversation/clipboard output, callback display copy, and launcher messages use the new product identity.
- [x] Inspect agent self-identification and update product identity where needed without changing agent IDs or routing.
- [x] Narrow and short terminals keep readable fallbacks. Art width thresholds are based on the replacement art, not historical assumptions.
- [x] Preserve technical identifiers, notices, provider behavior, saved state, commands, update/download endpoints, and Freebuff build behavior where it is a separate product.
- [x] A focused runnable branding check plus relevant existing tests and affected typechecks pass.
- [x] Record remaining old-name hits by purpose; do not claim literal zero source references.
- [x] Commit only this ticket's files and report evidence. No publishing or live authentication.

## Checkpoint

Relay `cbm-01`, leg 1, worker `d4ba8833-943a-4764-8257-f3350f223d09`, base `1a0c1cedc`, branch `feature/cbm-01`. One identity unit completed and independently reviewed. Outcome: `continue`; ticket 02 still requires a visual direction. No palette has been selected. The implementation and this checkpoint are committed together on the feature branch; the coordinator receives the exact commit ID in the relay report.

### Implementation and compatibility

- The CLI display seam supplies CBM-01 or Freebuff and the working `cbm`/`freebuff` command. Help, header, directory warnings, feedback prompts, initialization copy, login, error copy, diagnostics, clipboard/Markdown headers, callback HTML, and launcher welcome/download messages use the appropriate identity.
- Full, small, and text logos use CBM-01. Art selection measures actual rows and columns; short callers provide a height budget. Freebuff art remains unchanged. Existing colors and motion settings remain in place.
- Bundled `mod-default`, `mod-lite`, `mod-max`, and `mod-plan` display names and system introductions identify CBM-01. Routing IDs, model defaults, tools, and credentials are unchanged.
- The root README describes this fork and identifies Freebuff as a separate product. Launcher documentation keeps `codebuff-mod` installation and download names. LICENSE and NOTICE remain untouched.
- Existing export filenames (`codebuff-chat-*.md`), `codebuff-mod` package/binary/download names, `@codebuff/*` imports, `CODEBUFF_*` environment keys, `.config/manicode` storage, registry IDs, event names, and remote endpoints remain compatibility identifiers. Launcher failures naming the binary/package remain truthful diagnostics.
- Shared upstream agent definitions, SDK/type/template documentation, backend diagnostics, advertising-client identifiers (`Codebuff-CLI`), and upstream attribution still contain Codebuff. These shared defaults remain available to separate products and explicit upstream agents; the fork's mode map selects `mod-*`.
- Following the coordinator's explicit decision, `mod-default`, `mod-lite`, and `mod-max` use the existing `suppressCommitAttribution: true`. Their assembled tool descriptions omit all generated Codebuff footers and co-author examples, without inventing an address or changing shared SDK/Freebuff defaults. The reachable child closure is `file-picker` → `file-lister`, `code-searcher`, `thinker`, and `code-reviewer`; none has terminal tools. `mod-plan` also has no terminal tools. Existing history, notices, and user-supplied author text are untouched.

### Verification so far

All commands ran in this isolated worktree using Bun 1.3.14. Setup/build commands used the existing process-local `NODE_EXTRA_CA_CERTS=C:/Users/S.D/AppData/Local/Temp/codebuff-windows-trust.pem`; no permanent TLS settings changed.

| Check | Result |
| --- | --- |
| `bun install --frozen-lockfile` | Passed; 667 packages installed. The initial shell used PowerShell syntax in Traycer's Git Bash and was stopped, then rerun with correct syntax. |
| Baseline focused CLI/provider tests, before implementation | 95 passed, 2 failed across 9 files. Both failures were hard-coded POSIX path expectations in export tests. |
| Baseline `bun run --cwd cli typecheck` | Failed with 9 TS7016 errors for missing `react-dom/server` declarations. |
| New branding regression before implementation | 0 passed, 3 failed on old help identity, old title identity, and cropped art. |
| Focused tests after the attribution fix | 106 passed, 0 failed across 11 files; 430 assertions. |
| `FREEBUFF_MODE=true bun test src/__tests__/branding.test.tsx src/__tests__/cli-args.test.ts` from `cli/` | 22 passed, 0 failed; 105 assertions. |
| `bun run --cwd cli typecheck` | Passed after declaring the missing CLI dev dependency `@types/react-dom@19.2.3`, already pinned in root overrides. |
| `bun cli/scripts/build-binary.ts codebuff-mod 1.4.1` | Passed, including SDK build and Windows native bundle. |
| `cli/bin/codebuff-mod.exe --help` / `--version` | Exit 0; `Usage: cbm`, `CBM-01 CLI`, and `1.4.1`. |
| `bun freebuff/cli/build.ts 0.0.0-dev` | Passed; separate Windows Freebuff binary. Its `--help` and `--version` exit 0 with `Usage: freebuff`, Freebuff identity, and `0.0.0-dev`. |
| `bun test ./common/src/tools/params/tool/__tests__/run-terminal-command-attribution.test.ts` | 5 passed, 0 failed; 40 assertions. Shared default attribution remains intact. |
| `bun test ./packages/agent-runtime/src/__tests__/prompts-schema-handling.test.ts -t 'getToolSet: commit-attribution suppression'` | 2 passed, 0 failed, 15 filtered; 6 assertions. |
| `git diff --check` | Passed. |

The two baseline export tests now use native `path.resolve` expectations; export production behavior is unchanged. The only dependency addition is the missing development declaration package (manifest and lockfile). Bun also reconciled the stale lockfile CLI workspace version to the existing manifest's 1.4.1; no release version was changed.

The full runtime `prompts-schema-handling.test.ts` file produced 15 passed / 2 failed: `buildToolDescription preserves MCP params when schema is represented as allOf` (expected `allOf`, received flattened properties) and `getToolSet handles custom tools with problematic schemas` (`schema._zod.parent` TypeError). Both reproduced unchanged in a temporary detached worktree at `1a0c1cedc`, using the same dependency installation. That temporary worktree and its dependency junction were removed after recording `debug/cbm-01/baseline-runtime-schema.log`. These pre-existing schema failures are not waived as passing; the relevant attribution cases pass. Neither historical broad Windows suite counts nor unrun checks are treated as passing evidence.

Focused command from `cli/`:

```sh
bun test src/__tests__/branding.test.tsx src/__tests__/cli-args.test.ts src/commands/__tests__/copy-conversation.test.ts src/commands/__tests__/copy-conversation-clipboard.test.ts src/commands/__tests__/export-conversation.test.ts src/utils/__tests__/auth-oauth-preservation.test.ts src/utils/__tests__/chatgpt-oauth.test.ts src/utils/__tests__/grok-provider.test.ts src/utils/__tests__/providers.test.ts src/utils/__tests__/providers-models.test.ts src/utils/__tests__/providers-models-codex.test.ts
```

Local raw logs are in `debug/cbm-01/` (ignored build evidence). The focused branding check renders actual OpenTUI frames, exercises the help subprocess, title bytes, conversation serialization, escaped callback pages, bundled fork agent introductions, assembled tool descriptions across reachable children, and postinstall output in an isolated VM. The attribution regression failed on the old footer before the flags were added. `tmux` is unavailable on this host; no live interactive acceptance, sign-in, inference, release download, publication, merge, or push has been performed.

### Review

Read-only reviewer `19cce268-e61a-4947-8586-4886e944e296` (Codex, GPT-6 Astra, high, full_access) approved after the generated-attribution P2 finding was fixed. No outstanding code findings. The reviewer independently ran branding 7/0 in both product modes, common attribution 5/0, runtime attribution 2/0 (15 filtered), and a clean diff check. The review did not independently repeat builds or typechecks.

Review artifact: `C:/Users/S.D/.traycer/epics/534ebcad-526b-42d9-a142-dfd98ca72ffd/artifacts/cbm-01-identity-review/index.md`.

### Controller-requested copy follow-up

Commit `7421275253c1724873b5b768f7f3dc9d428fefb3` updates only the root/release introductions and package description to standalone CBM-01 wording with API-key or subscription providers, removes the unnecessary service reference from the release guide's active-profile explanation, and simplifies the postinstall welcome to `CBM-01 installed.`. Its existing branding assertion was adjusted. Provenance/license sections, service troubleshooting, installation names, binary cleanup names, repository URLs, and original notices remain unchanged.

Follow-up verification on 2026-09-10: from `cli/`, `bun test ./src/__tests__/branding.test.tsx` passed 7/0 with 73 assertions, and the same command with process-local `FREEBUFF_MODE=true` passed 7/0 with 73 assertions. `git diff --check` passed. No new tests, repeated build, or repeated typecheck were needed for these prose and script-output changes, as directed by the coordinator. Earlier implementation verification counts above remain the evidence for commit `31e783faef60866d8a4926cd6201278b4bd4ca2c`.

This remains relay leg 1, one completed identity unit, outcome `continue`; ticket 02 still awaits the user's visual direction.
