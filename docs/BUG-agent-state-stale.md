# BUG: Agent definition state and counters remain stale after completion

**Status:** OPEN — reproduced by user, not yet fixed
**Reported:** 2026-11-24
**Severity:** Medium (misleading observability UI; no data loss)
**Component:** TUI Overview panel / agent definitions / status derivation

---

## Summary

After running the delegation prompt in the fake repository, agent definitions
that have completed still show a green running dot (`●`) together with a
`completed` note. The status line also reports `Agents 28` and `Running 4`,
although the current project defines only five agents in
`agent-monitor-fixtures/.opencode/agents/`.

---

## Environment

| Item | Value |
|---|---|
| the host TUI | v2.4.1 |
| Node | v26.13.1 |
| Plugin version | 1.0.0 |
| Fixture repo | `agent-monitor-fixtures/` |
| Load method | Project config via `.opencode/opencode.json` plugin path |
| Command | `opencode` from the fixture directory |

---

## Reproduction

1. Start the host TUI from `agent-monitor-fixtures/`.
2. Run:

   ```text
   Use orchestrator to delegate API work to backend-agent, tests to test-agent, and docs to docs-agent.
   ```

3. Wait for the agents to finish.
4. Press `Ctrl+G`, open tab `1` Overview.

---

## Actual result

Observed by user:

```text
Agents 28  Running 4  Pending 0  History ...

● orchestrator PRIMARY completed
Coordinates fixture work by delegating to test suba…

● backend-agent SUBAGENT completed
Edits the fake API and reads demo.env to trigger a …

● docs-agent SUBAGENT completed
Updates fake documentation without changing source …

● recovery-agent SUBAGENT completed
Performs recovery by running the passing test comma…

✓ recovery-agent SUBAGENT
Performs recovery by running the passing test comma…

● test-agent SUBAGENT completed
Runs the intentionally failing test suite and repor…

RUNNING  WAITING
4        0
derived
COMPLETED FAILED
2        0
```

- Green dot (`●`) with `completed` note.
- `Agents 28` although only five agent definitions exist.
- `Running 4` although the agents have finished.
- Some cards show `Unavailable` (this part may be honest if no token/cost data was observed).

---

## Expected result

```text
Agents 5 · Running 0 · Pending 0 · History ready

AGENTS
✓ orchestrator PRIMARY
✓ backend-agent SUBAGENT
✓ docs-agent SUBAGENT
✕ test-agent SUBAGENT        (if its session outcome failed)
✓ recovery-agent SUBAGENT
```

- Green `●` only while an agent is genuinely running.
- Completed agents use `✓` (info color).
- Failed agents use `✕` (error color).
- `Agents` equals the number of definitions in `.opencode/agents/` (five).

---

## Attempted fixes already applied

All of these are in the current working tree; `npm test` reports 92 passing tests.

1. **Session scoping**
   - Added `sessionBelongsToLocation()` in `src/adapters/sessions/session.ts`.
   - Client cache and `client.session.list({ directory, limit: 100 })` are filtered
     to `context.location.directory`.
   - `activeSessions` is pruned to known sessions after refresh.

2. **Outcome precedence**
   - `buildAgentTree()` in `src/application/reducer.ts` now prefers durable
     `Session.Info.outcome` over transient `statusOverrides`.
   - Terminal execution events (`succeeded`, `failed`, `interrupted`) clear the
     status override and add a note.

3. **Definition-based counters**
   - Overview cards and status line now count agent definitions instead of all
     sessions.
   - The live-session tree was removed from the UI.

4. **Colors**
   - `AgentDefinitionList` maps `running → success`, `completed → info`,
     `failed → error`, `idle → muted`, `unknown → faint`.

The bug was reported as still present after these changes. A full the host TUI
restart was recommended but not yet confirmed as tested.

---

## Suspected remaining causes

Ranked by likelihood:

1. **Definition link picks the wrong session**
   - `definitions` in `src/tui.tsx` links a definition to the first matching
     running session with `session.agent === definition.id`.
   - If multiple historical sessions share the same agent ID, a stale running
     session from the same project may win over the newest completed session.
   - Fix direction: choose the **most recent** session for an agent, then derive
     status from that session only.

2. **Status overrides still applied before outcome is refreshed**
   - `session.status: busy` events may arrive after the outcome event.
   - Although outcome now wins in `buildAgentTree`, the definition link may use
     a different session whose outcome is absent.

3. **`context.data.session.status()` is stale**
   - Server `Session.Info.outcome` may be present, but the client status helper
     may still report `"running"`.
   - Fix direction: rely on outcome first and treat client status as secondary.

4. **Location filtering may not match nested repo**
   - The fixture is a nested Git repository inside the parent project.
   - the host TUI `context.location.directory` may resolve to the parent in some
     sessions, causing sessions from both directories to be merged.
   - Fix direction: log the effective directory and compare each session's
     `location.directory` during reproduction.

5. **Definition state not refreshed after session updates**
   - `agentDefinitions` refresh only on setup and `agent.updated`.
   - Links are recomputed from `nodes()` reactively, so this is less likely, but
     worth verifying with debug output.

---

## Relevant files

| File | Role |
|---|---|
| `src/tui.tsx` | session refresh, status overrides, active poll, definition links |
| `src/application/reducer.ts` | `buildAgentTree`, outcome/status precedence |
| `src/adapters/agents/definitions.ts` | agent definition mapping |
| `src/adapters/sessions/session.ts` | location filter |
| `src/ui/components/AgentDefinitionList.tsx` | state colors and glyphs |
| `src/ui/panels/TimelinePanel.tsx` | Overview counters and status line |
| `src/ui/sidebar/Sidebar.tsx` | sidebar counters |
| `docs/ARCHITECTURE.md` | documented intended behavior |
| `agent-monitor-fixtures/TEST_LAB.md` | reproduction playbook |

---

## Suggested debugging steps

1. Add temporary debug logging in `src/tui.tsx` `definitions` memo:
   - definition ID
   - linked session ID
   - linked session outcome
   - `statusOverrides` value
   - `activeSessions` membership
   - session `location.directory`

2. Check whether the linked session for `backend-agent` has:
   - `outcome: "succeeded"` or missing,
   - `status: "running"` or `"idle"`,
   - a different `location.directory`.

3. Inspect the event log for late `session.status: busy` events after completion:

   ```sh
   grep -i 'session.status' ~/.local/share/opencode/log/opencode.log | tail -40
   ```

4. Write a failing unit/integration test that reproduces:
   - two sessions with the same `agent` ID,
   - one stale `running`,
   - one newest `succeeded`,
   - assert the definition links to the newest and shows completed.

---

## Workaround

None. The wrong state is visual only; it does not modify agent behavior or approve permissions.

---

## Acceptance criteria for closing this bug

- `Agents` equals the number of visible definitions from the current location.
- `Running` equals definitions with a genuinely active session.
- Completed definitions always show `✓` info color, never green `●`.
- Historical sessions from other projects or older sessions cannot affect current definition state.
- A regression test covers duplicate agent IDs with stale and current sessions.
