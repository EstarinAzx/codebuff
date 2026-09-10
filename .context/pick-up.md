---
type: handoff
updated: 2026-09-11
---

# Pick up

Read [[active-work]]. **The tested search/browser/Windows preview is integrated into `modded` and installed locally.** `rdx`, `cbm` and `codebuff-mod` all report `1.5.2-dev.tools`. No active work remains.

The user authorized local installation while preserving profiles. Both profiles remain, Grok stays selected, and provider/credential/connector fingerprints are unchanged. Existing RD-X-96 sessions were preserved; start a new `rdx` session for the upgrade. `/browser on` and `/computer on` enable local control without another API key.

The integration passed 190 regression tests, four typechecks and independent review. A focused launcher regression also passes: the preview is retained over 1.5.1 and later stable updates still work. Installed executable/WASM hashes and aliases were verified outside the repository.

This was a local install, with no push or publication. Keep the public 1.5.1 release/tag fixed and preserve `main` as the upstream mirror and user-owned `.codeboarding/`. The epic's `artifacts/rdx-web-computer-install/index.md` owns installation/rollback evidence. If asked to publish, use a new stable version and [MERGE-STRATEGY.md](../MERGE-STRATEGY.md).

## Related

- [[overview]]
- [[active-work]]
