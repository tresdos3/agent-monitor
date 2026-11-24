# Testing Strategy

## Layers

### Unit (`src/test/unit`)

Pure functions only; no the host TUI runtime.

- `normalize.test.ts` — V2 event → `NormalizedEvent`, noise filtering, severity,
  no fabricated session IDs, unknown events.
- `reducer.test.ts` — bounded timeline, session → agent tree, evidence levels,
  token conversion.
- `selectors.test.ts` — overview counts, tree ordering, activity evidence,
  stale detection (fake scenarios 1 and 8).
- `session-adapter.test.ts` — `SessionInfo` mapping without invented fields.
- `navigation.test.ts` — session navigation commands and palette cap.
- `timeline.test.ts` — ID dedupe, live/RPC merge, ordering, and agent/kind/
  severity filters.
- `permission-adapter.test.ts` — native request mapping, event timestamps, and
  `Unavailable` when no timestamp was observed.
- `usage.test.ts` — token mapping and estimate provenance.
- `vcs.test.ts` — branch/changed-file mapping and unavailable states.
- `test-evidence.test.ts` — observed shell commands versus agent claims.
- `harness.test.ts` — evidence levels, acceptance-criteria detection, and
  out-of-scope path checks using the fake repository.

Run: `npm test`.

### Integration (`src/test/integration`)

`vitest` with a mocked `@opencode/plugin/tui` module. Verifies that `setup`:

- registers `sidebar.content`,
- subscribes to `session.execution.started`,
- registers the keymap command,
- disposes subscription and slot on cleanup,
- tolerates malformed events.

Run: `npm test`.

### TUI / manual (human, in a real terminal)

1. Load the plugin globally (see `INSTALLATION.md`).
2. Start `opencode` in a project and confirm the `AGENT MONITOR — SPIKE` sidebar
   lines and the `MONITOR` footer canary.
3. Start a session and confirm `Events observed` increments.
4. Press `Ctrl+G` and confirm the monitor panel opens; outside a session,
   confirm the plugin-route fallback.
5. Confirm overview counts, agent hierarchy, and current activity appear.
6. Open an agent via its palette command and confirm the native session opens.
7. Open the monitor panel and confirm PERMISSIONS and TIMELINE sections.
8. Run the filter palette commands and confirm the active filter line changes.
9. Trigger a permission prompt (e.g. a harmless `*.env` read) and confirm the
   request appears with agent/action/resource; use the native prompt to decide.
10. Confirm `Agent Monitor: ping` is available in the palette.
11. Disable/reload the plugin and confirm no errors in the host TUI logs.

Do not claim these manual checks passed until performed. `PROJECT_STATUS.md`
tracks them.

### Fake repository (`agent-monitor-fixtures/`)

Deterministic fixtures map to scenarios:

| Scenario | Fixture |
|---|---|
| 1 Multi-agent execution | `fixtures/agents/scenario-1-hierarchy.json`, `fixtures/events/scenario-1-events.json` |
| 2 Permission request | `fixtures/permissions/scenario-2-permission.json` |
| 3 Failure/recovery | `fixtures/events/scenario-3-failure-recovery.json` |
| 4 Usage analytics | `fixtures/usage/scenario-4-usage.json` |
| 5 Git activity | `fixtures/git/scenario-5-git-status.json` |
| 6 Test execution | `fixtures/tests/scenario-6-test-evidence.json` |
| 7 Missing observability | `fixtures/usage/scenario-7-missing-usage.json`, `fixtures/failures/scenario-7-unsupported.json` |
| 8 Stale session | `fixtures/failures/scenario-8-stale-session.json` |

Fixtures are simulation only. They must never be presented as evidence of real
the host TUI integration.

## Quality gates after every meaningful change

```sh
npm run typecheck
npm test
```

## Stability tests (Phase 5)

- `stability.test.ts` — 5,000 events stay bounded to 200, 100 sessions build a
  tree, and 50 setup/cleanup cycles dispose every subscription and slot.
- Integration test for degraded capabilities: RPC and VCS failures leave the
  monitor live and do not throw.
- `npm run verify:compat` checks the installed host version against the
  pinned `@opencode/plugin` dependency.

- `ui-responsive.test.ts` — width classification, metric column counts, empty
  state, running/multiple-child agents, pending permissions, failed agents,
  stale sessions, missing token/pricing data, and bounded large event lists
  using the fake repository fixtures.

## Live fixture project

`agent-monitor-fixtures/` now contains `.opencode/agents/` definitions and an
independent Git repository with a known dirty working tree. Use
`agent-monitor-fixtures/TEST_LAB.md` for the step-by-step live playbook and
expected results covering hierarchy, permissions, failure/recovery, Git,
usage, harness evidence, and narrow layouts. Static JSON fixtures remain the
deterministic source for unit tests.

Subagent visibility tests cover: V2 status mapping (`idle | busy | retry`),
status overrides in `buildAgentTree()`, active-session cross-checks, and the
`SUBAGENT` / `retry` UI badges. Live validation is in TEST_LAB step 2: launching
orchestrator subagents should show indented children with at least one running
dot while work is in progress.

Manual-only checks (documented, not automated): terminal resizing, narrow
layouts, and real multi-location sessions.
