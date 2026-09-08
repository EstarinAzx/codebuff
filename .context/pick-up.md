---
type: handoff
updated: 2026-09-09
---

# Pick up

**Start: read .context/overview.md + .context/active-work.md.**

**Grok for 1.4.1 is implemented, reviewed and committed locally** at bc2fd502c on modded. /providers:add grok [name] connects a subscription through device OAuth. Refresh, model discovery, bindings, streaming/tool calls and structured/non-streaming requests are covered. 117 targeted tests and all three package typechecks pass; independent review has no open findings.

**Next task: live Grok acceptance, then ship 1.4.1 with user authorization.** The local Windows executable is cli/bin/codebuff-mod.exe; run /providers:add grok, approve the displayed xAI link, then /model, /providers:test, and a short tool-using task. Only the public device-code request has been verified live; authenticated subscription inference has not.

All three archives and SHA256SUMS are prepared in **cli/dist-binaries/1.4.1/**; root-level archives are still 1.4.0. Extracted Windows startup reports 1.4.1; Linux architecture/contents are checked, not runtime execution. npm dry run passes. Follow MERGE-STRATEGY.md Step 6; GitHub assets precede npm publishing, which requires native 2FA. No 1.4.1 push, tag, publish or installed-version update has run. npm latest remains 1.4.0.

Landmines: preserve provider selection and existing Codex credentials; this session acquired no Grok tokens. Trust-bundle and cross-build paths are in active-work.md. Broad Windows baseline failures remain documented. .codeboarding/ is the user's and stays untracked.

## Related

- [[overview]]
- [[active-work]]
