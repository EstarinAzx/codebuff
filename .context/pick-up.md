---
type: handoff
updated: 2026-09-09
---

# Pick up

**Start: read .context/overview.md + .context/active-work.md.**

**v1.4.1 is shipped.** Source is pushed on modded, tag v1.4.1 points to e049416ae, and GitHub has all three verified archives plus SHA256SUMS. npm registry-direct latest is 1.4.1. The installed cbm reports 1.4.1 and its executable hash matches the verified build. 117 targeted tests and all three package typechecks pass; independent review has no open findings.

**Next task: none required for the release.** To use Grok, run cbm and /providers:add grok [name], approve the xAI link, then /model and /providers:test. A live tool-using task remains useful acceptance testing: only the public device-code request has been verified live, not authenticated Grok inference. The user explicitly authorized publication without that step.

Local release files are in **cli/dist-binaries/1.4.1/**; root-level archives remain 1.4.0. Linux architecture and contents are checked, not runtime execution. Future publication follows MERGE-STRATEGY.md Step 6: GitHub assets before npm. npm required an interactive TTY and the user's browser 2FA approval. A partial local tar dependency was repaired from its integrity-verified registry archive before the installed CLI passed.

Landmines: preserve provider selection and existing Codex credentials; this session acquired no Grok tokens. Trust-bundle and cross-build paths are in active-work.md. Broad Windows baseline failures remain documented. .codeboarding/ is the user's and stays untracked.

## Related

- [[overview]]
- [[active-work]]
