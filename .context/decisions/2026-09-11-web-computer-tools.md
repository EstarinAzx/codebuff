---
type: decision
project: RD-X-96
updated: 2026-09-11
tags: [decisions, web, computer-tools]
---

# Search and computer tools without another API key

## Decision

The user's scope and settled approach are recorded in `epics/534ebcad-526b-42d9-a142-dfd98ca72ffd/artifacts/rdx-web-computer-tools/index.md`. Preserve existing subscriptions and keep Grok selected. [Usage documentation](../../docs/computer-tools.md) describes the behavior.

## Why

An additional service key was explicitly rejected. A real request demonstrated that RD-X-96 Codex credentials can perform hosted search. Browser/desktop control needs local executors, not another model SDK import.

## Reversibility

The upgrade is isolated on `feature/rdx-web-computer-tools`, with no global installation or publication. Local control is opt-in; provider credentials remain separate from connector settings.

## Related

- [[decisions]]
- [[active-work]]
