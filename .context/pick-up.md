---
type: handoff
updated: 2026-09-11
---

# Pick up

Read [[active-work]]. **The MCP first-request schema crash is fixed and installed locally.** `rdx`, `cbm` and `codebuff-mod` report `1.5.2-dev.tools.1`. No active work remains. Restart any old CLI session before retrying; computer control remains enabled and browser control remains disabled, matching the user's saved settings.

Root cause: deep copying Zod erased private schema state. The fixed pipeline preserves Zod instances and original JSON Schema, while retaining existing validation. It also removes internal step flags before external validation. No dependency, model, provider or credential change was required.

239 regression tests, runtime/SDK/CLI typechecks, independent review, real 43-schema preparation and an actual Grok desktop-tool round trip passed. A second live check ran through the rebuilt public SDK and complete agent loop. Installed binary/WASM hashes and all aliases were verified; all six provider/credential/connector-setting fingerprints remain unchanged.

The epic's `artifacts/rdx-mcp-schema-fix/index.md` owns evidence and rollback details. The prior preview-install and release artifacts remain historical evidence. No push or publication occurred. Preserve the old 1.5.1 release tag, upstream `main` and user-owned `.codeboarding/`. Follow [MERGE-STRATEGY.md](../MERGE-STRATEGY.md) if asked to publish.

## Related

- [[overview]]
- [[active-work]]
