---
type: handoff
updated: 2026-09-11
---

# Pick up

The user confirmed computer-use smoke testing passed and authorized publishing RD-X-96. Release **1.6.0** is in preparation; follow this epic's `artifacts/rd-x-96-release-1-6-0/index.md` for the current gate/state.

The runtime/schema fix is already integrated and installed as preview `1.5.2-dev.tools.1`. The release promotes that source, its tested system-certificate launcher behavior and updated package documentation. Release checks passed: 252 tests, common/SDK/CLI/runtime typechecks, frozen lockfile check and five-file npm dry run. The new version is available; npm identity is tsd47216.

Finish the frozen source/build review, build and verify Windows x64/Linux x64/Linux arm64 archives, push `modded` and the fixed release tag, upload GitHub assets before npm, then verify public artifacts and the installed version. WSL is not installed; do not claim Linux runtime execution. Cached Linux Bun compilers must match the fresh registry integrity values.

Publication is authorized. Preserve npm account/package security; if native npm web approval is needed, show its complete live URL on its own line promptly. Never store live approval URLs or credentials in artifacts. Preserve all provider/credential/connector settings, existing user sessions, upstream `main`, old release tags and user-owned `.codeboarding/`.

## Related

- [[overview]]
- [[active-work]] — completed preview/schema-fix context
