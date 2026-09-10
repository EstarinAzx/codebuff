---
type: handoff
updated: 2026-09-11
---

# Pick up

The user authorized integrating and installing the tested search/browser/Windows preview as local `rdx`, preserving all profiles. Integration of `feature/rdx-web-computer-tools` (`ec079585bf19020dc62f36d0f1ee50a20edc6518`) into `modded` is in progress; the sole merge conflict was this handoff note.

Read this epic's `artifacts/rdx-web-computer-install/index.md` for installation progress. The original feature verification is in `artifacts/rdx-web-computer-tools/index.md`. Complete merged regression checks, install the exact tested `1.5.2-dev.tools` executable/WASM, then verify the aliases and pre-install settings fingerprints in `debug/local-install-1.5.2-dev.tools/`.

Do not publish or push. Preserve the running RD-X-96 session, provider/auth/connector settings, the old public 1.5.1 release tag, upstream `main`, and user-owned `.codeboarding/`. The retained feature worktree owns the verified executable and its system-trust preview launcher.

## Related

- [[overview]]
- [[active-work]] — feature verification before integration
