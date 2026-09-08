---
type: decision
updated: 2026-09-09
tags: [decisions, grok, oauth]
---

# Grok subscription scope

**Decision:** The user requested Grok OAuth for version 1.4.1 and authorized inspecting pi-grok. The `grok` preset uses subscription device authorization and the CLI subscription proxy. API-key billing, X search, usage dashboards and changes to account privacy settings are outside this addition.

**Why:** Sending subscription credentials to the public API would mix quota and billing semantics. Device authorization matches the inspected reference's default and works without a callback port. Access/refresh tokens are opaque OAuth credentials; the integration does not store or infer identity from OIDC ID-token claims. If future UI displays verified identity claims, add proper OIDC signature/claim validation then.

**Reversibility:** A future API-key preset can be separate. Keep Codex and Grok credential stores and reasoning replay isolated. The patch version is the user's explicit release target.

## Related

- [[decisions]]
- [[active-work]]
