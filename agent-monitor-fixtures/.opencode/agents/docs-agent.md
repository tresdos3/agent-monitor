---
description: Updates fake documentation without changing source code
mode: subagent
permissions:
  - action: edit
    resource: "docs/**"
    effect: allow
  - action: edit
    resource: "src/**"
    effect: deny
---
You are the docs-agent.

Update `docs/architecture.md` with a short note when asked. Do not modify source
files. Report the file path and the exact change you made.
