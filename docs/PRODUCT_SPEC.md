# Product Specification

## Identity

- **Name:** Agent Monitor
- **Type:** standalone plugin for the host TUI
- **Primary interface:** persistent right sidebar (native `sidebar.content` slot)
- **Objective:** Full Development Observability

## Product principles

1. TUI-native; no web dashboard, Electron app, or external backend in the MVP.
2. Local-first and read-only by default.
3. No automatic permission approval.
4. Measured data and estimates are visibly distinct.
5. Unsupported or missing information renders as `Unavailable`.
6. Complement native the host TUI features rather than duplicate them.
7. Compatible with the declared host version (v2.4.1).

## Modules

### A — Agent Command Center

Active/completed/failed/waiting agents, names and IDs, parent/child
relationships, current task/tool/file when reliably observable, duration,
last activity, session association, and navigation to the native session.

### B — Execution Timeline

Ordered observable events: session created, agent started/completed, tool
started/completed, permission requested/resolved, error, file modified when
attributable, session completed. Filterable by agent, type, and severity.

### C — Token and Cost Analytics

Input/output/cached/reasoning/total tokens, session duration, per-agent usage,
and cost with provenance. host-reported cost is labeled as reported;
independent estimates are labeled `Estimated` with pricing source/version/date.

### D — Permission Center

Pending permission requests with requesting agent, tool/operation, resource,
timestamp, and status. Uses the host TUI's native approval/rejection. Never
auto-approves.

### E — Project Intelligence

Git branch, working tree status, changed files, file activity, observed test
and build results, errors, and recent development activity. Tests/builds are
"completed" only when their execution and result were observed.

### F — Harness Inspector

Evidence-based checks for `AGENTS.md`, project specification, implementation
plan, acceptance criteria, tests, changed files, out-of-scope modifications,
and human approval checkpoints.

Evidence levels:

| Level | Meaning |
|---|---|
| Verified | Confirmed through independent observable evidence |
| Observed | Directly detected during execution |
| Declared | Reported by an agent, not independently confirmed |
| Missing | Required evidence is unavailable |
| Failed | A check was performed and failed |

Agent self-reports are never independently verified evidence.

## Non-goals for MVP

- Independent permission system.
- Self-contained cost pricing database.
- Claiming file authorship from `filesystem.changed` alone.
- Claiming test success from agent text.
- Persisting prompts or sensitive file contents.
