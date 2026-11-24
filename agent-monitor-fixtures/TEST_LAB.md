# Agent Monitor Test Lab

This is the hands-on validation guide for Agent Monitor. It uses the
fake repository in this directory to produce real host v2.4.1 events
without touching production code.

## 0. Prerequisites

```sh
node --version                 # v26.13.1 or >=26.4.0
opencode --version             # v2.4.1

cd ..                          # from agent-monitor-fixtures to repo root
npm run verify:compat
npm test                       # 101 tests should pass
```

The fake repo must have its dev dependencies installed:

```sh
cd agent-monitor-fixtures
npm install
npm test                       # expected: 3 pass / 1 fail (intentional)
npm run test:pass              # expected: 2 pass
```

## 1. Load the plugin

From this directory:

```sh
opencode
```

No extra environment variable is needed: `.opencode/opencode.json` uses the
relative plugin path `../../`, so the plugin loads from the sibling package
through both the **server + TUI** entry points. Do not replace this with an env
var — the host TUI's background server may not inherit env vars set for the CLI
process, which would produce `1 plugin failed` with `target=""`.

Loading the plugin only through `OPENCODE_CLI_CONFIG_CONTENT` starts just the
TUI part; in that mode the status line honestly shows `History live-only`.

`.opencode/opencode.json` also sets `default_agent: orchestrator`, so a new
session starts as the orchestrator.

## 2. First look

**Expected:**

- Toast: `Agent Monitor loaded`
- Sidebar: `AGENT MONITOR`, then `OVERVIEW`, `AGENT TREE`, `CURRENT ACTIVITY`,
  `USAGE` when data exists
- Footer: `MONITOR <n>● <n>◷`

Open the panel with `Ctrl+G`.

| Key | Action |
|---|---|
| `Ctrl+G` | Toggle monitor panel |
| `1` | Overview tab |
| `2` | Timeline tab |
| `3` | Harness tab |
| `4` | Usage tab |
| `Esc` / `q` | Close panel |

**Expected panel header:** `AGENT MONITOR` + `● LIVE`, active tab highlighted,
status line `Agents 5 · Running 0 · Pending 0 · History ready`. `Agents` and the
four overview cards count agent definitions from `.opencode/agents/`, not all
historical sessions. If you load the plugin via `cli.json` instead, this shows
`History live-only` — still correct, but without server-backed history.

---

## 3. Scenario 1 — Agent hierarchy

Prompt:

```text
Use orchestrator to delegate API work to backend-agent, tests to test-agent, and docs to docs-agent.
```

**Expected:**

| Location | Expected result |
|---|---|
| Overview → AGENTS | The five definitions from `.opencode/agents/` appear: `orchestrator`, `backend-agent`, `test-agent`, `docs-agent`, `recovery-agent` |
| Colors | `●` success = running, `✓` info = completed, `✕` error = failed, `○` muted = idle; `PRIMARY` in action color, `SUBAGENT` in info color |
| No session tree | The old LIVE SESSIONS box is removed; only current-project agent definitions are shown |
| Overview tab | `RUNNING` counter increases; AGENTS list shows running state |
| Status line | Separate `Running N` count shows background subagents even when the primary session is idle |
| Footer | Running dot count increases |
| During work | At least one child shows `●` (running); a `retry` child shows the `retry` note |

> **Known issue:** if completed agents keep a green `●` or `Agents` shows a
> number larger than 5, see `docs/BUG-agent-state-stale.md` in the parent project.
> This is tracked separately from the normal expected behavior above.

---

## 4. Scenario 2 — Permission request

Prompt:

```text
Use backend-agent to read demo.env and then edit src/api.ts.
```

**Expected:**

- Native the host TUI permission prompt appears — this is the only place to approve
  or reject.
- Monitor shows `◷ permission` on the requesting agent.
- Overview → `PENDING PERMISSIONS` shows `read` + `demo.env` + `backend-agent`.
- After the native prompt is resolved, pending count drops and the row becomes
  resolved.

The monitor **never auto-approves**.

---

## 5. Scenario 3 — Failure and recovery

Prompt:

```text
Use test-agent to run npm test.
```

**Expected:**

- `npm test` result: **3 passed / 1 failed** (intentional).
- Timeline: `✕ Tool failed` / `✕ Execution failed` events with details.
- Overview: `FAILED` counter becomes 1.

Then:

```text
Use recovery-agent to run npm run test:pass.
```

**Expected:**

- `npm run test:pass` → 2 tests pass.
- Timeline shows a success event after the failure.
- No success claim without an observed command result.

---

## 6. Scenario 4 — Git activity

Check Overview secondary column or Usage → PROJECT CONTEXT.

**Expected:**

```text
Branch: main
Changed: 3 (1+ 1~ 1-)
```

Files:

- `modified src/api.ts`
- `added src/generated.ts`
- `deleted docs/old-notes.md`

If the branch shows `dev`, you opened the parent repo instead of the nested
fixture repo.

---

## 7. Scenario 5 — Usage analytics

Open tab `4` after agents have run.

**Expected:**

- Metric cards: `INPUT`, `OUTPUT`, `CACHED`, `REASONING`, `TOTAL`
- Text bars per token category
- `USAGE BY AGENT` — only agents with observed tokens
- `USAGE BY MODEL` — only agents with reliable model info
- COST: `Reported <value>`; `Estimated` hidden by default

Toggle estimate with `Agent Monitor: toggle cost estimate`.

**Expected with estimate on:**

```text
Estimated 0.0421
the host TUI model catalog (models.dev) · v2.4.1 · 2026-11-23
```

If pricing data is missing: `Estimated: Unavailable`. Never a fabricated number.

---

## 8. Scenario 6 — Harness evidence

Open tab `3`.

**Expected:**

- `VERIFICATION SUMMARY` with counts for all five evidence levels
- Progress bar and `% independently evidenced`
- Sections only for non-empty groups: `VERIFIED`, `OBSERVED`, `DECLARED`,
  `MISSING`, `FAILED`
- Each row: glyph, evidence level, title, explanation, optional resource path
- Note: `Agent self-reports are Declared, never Verified.`

---

## 9. Scenario 7 — Timeline and filters

Open tab `2`.

**Expected row format:**

```text
10:00:05 ● session.tool.called edit
          command: npm test                 00:01
```

- timestamp in wide layout
- severity glyph
- raw event type
- title
- agent name
- detail and derived duration when available

Set filters with palette commands:

```text
Agent Monitor: filter by agent
Agent Monitor: filter by kind
Agent Monitor: filter by severity
Agent Monitor: clear filters
```

Filter chips appear only on the Timeline tab and reflect active filters.

---

## 10. Scenario 8 — Narrow terminal

Shrink the terminal below ~64 columns.

**Expected:**

- single column
- tab bar without `[1]` prefixes
- timeline rows without timestamp/agent columns
- metric cards stacked one per row

---

## 11. Scenario 9 — Missing evidence

Copy `fixtures/missing-evidence/` outside this repo and open the plugin there.

**Expected:**

- Harness tab: `Missing` / `Unavailable`
- Usage tab: `Unavailable` for missing token/cost data
- No fabricated values, no crash

---

## Useful palette commands

| Command | Purpose |
|---|---|
| `Agent Monitor: toggle` | Open/close panel (`Ctrl+G`) |
| `Agent Monitor: close` | Close panel/route |
| `Agent Monitor: filter by agent/kind/severity` | Timeline filters |
| `Agent Monitor: clear filters` | Reset filters |
| `Agent Monitor: toggle compact mode` | Hide activity/usage in sidebar |
| `Agent Monitor: toggle cost estimate` | Show opt-in estimate |
| `Agent Monitor: session history` | Navigate to another session |
| `Agent Monitor: harness inspector` | Open panel directly |
| `Agent Monitor: open <agent>` | Navigate to native session |

---

## Troubleshooting

| Problem | Check |
|---|---|
| No sidebar | `~/.config/opencode/cli.json` → `"session": { "sidebar": "auto" }` |
| `No test files found` | Ensure `agent-monitor-fixtures/vitest.config.ts` exists |
| No permission prompt | Ensure `demo.env` exists and `.opencode/opencode.json` has `read *.env → ask` |
| No agents listed | Check `.opencode/agents/*.md` exist |
| `1 plugin failed` / `target=""` | The plugin path in `.opencode/opencode.json` is empty or an env var did not reach the server; use the literal absolute path |
| `History live-only` | You loaded via `cli.json`; use the project config path so the server part and RPC history load |
| Agent definitions not visible | Check `.opencode/agents/*.md` exist; built-in and hidden agents are filtered out by default |
| Subagents not running | Definitions always appear; running dots appear only after `session.created`/`session.forked` events and a matching active session |
| Agents from other projects stay green | Session reads are scoped to `context.location.directory`; if it persists, log it under `docs/BUG-agent-state-stale.md` |
| `Unavailable` usage values | No model calls yet or model catalog not synced |

---

## Success checklist

- [x] Sidebar and footer canary render. — verified in pane capture: `MONITOR 0● 0◷`
- [x] `Ctrl+G` opens/closes panel; `1`–`4` switch tabs. — all four headers captured
- [x] Orchestrator plus child agents appear in the tree. — `Agents 5`, five definitions with `✓`/`●` glyphs
- [ ] Permission prompt is native; monitor shows pending/resolved state. — native `Read demo.env` prompt observed; `Pending 1` shown; **left for a human to decide** (never auto-approved)
- [ ] Failure appears in timeline; recovery appears after it. — failure observed (`npm test` → 3 pass / 1 fail); recovery prompt not run (needs the permission decision first)
- [x] Git shows 3 changed files on `main`. — LAB verifier fixture Git checks passed
- [x] Usage shows token breakdown and provenance-labeled cost. — tab `4` shows token categories and per-agent rows; cost shown as `Reported`/`Unavailable` honestly
- [x] Harness groups checks by evidence level. — `Verified 0 Observed 8 Declared 0 Missing 1 Failed 0`, 89% evidenced
- [x] Filters and narrow layout work. — three filter chips render on tab `2`; 60×30 resize survived with single-column layout
- [ ] Missing-evidence location shows `Unavailable`, never guesses. — requires copying a fixture outside this repo; unit test covers `Unavailable` values

## Automated audit result (2026-11-24, final)

`npm run test:lab` passed again: **27 passed, 0 failed, 0 warnings**. The
scenario 1 delegation prompt was then run live in the fixture TUI. The quota
block cleared; four child sessions completed and the newest backend-agent
session remained genuinely running because it is waiting on the native
`Read demo.env` permission prompt (left for a human).

Before the state converged, completed agents briefly showed green `●` with a
`completed` note. A late `session.status: busy` can re-add a running override
after a terminal event, so terminal session IDs are now latched until a new
`session.execution.started` arrives. Final live capture: `Running 1`,
`Completed 4`, with `✓ orchestrator`, `✓ docs-agent`, `✓ test-agent`, and
`● backend-agent` (pending permission).

The checklist above was checked against live pane captures where possible:

| Checklist item | Result |
|---|---|
| Sidebar and footer canary render | PASS — `MONITOR 0● 0◷` visible in pane capture |
| `Ctrl+G` opens/closes panel; tabs `1`–`4` | PASS — all four tab headers captured |
| Five agent definitions with completed glyphs | PASS — `Agents 5  Running 0`, five `✓`, `COMPLETED 5` |
| Git shows 3 changed files on `main` | PASS — fixture Git state checks in LAB verifier |
| Harness groups by evidence level | PASS — `Verified 0 Observed 8 Declared 0 Missing 1 Failed 0`, 89% evidenced |
| Usage token breakdown / cost provenance | PARTIAL — token categories and per-agent rows render; current session shows `Unavailable`; estimated cost toggle needs a human-visible run |
| Filters (`agent`/`kind`/`severity` chips) | PASS as UI — all three chips render on tab `2`; filter selection not exercised |
| Narrow layout | PASS — 60×30 pane shows single column, no tab prefixes, no crash |
| Missing-evidence location | NOT RUN — requires copying a fixture outside this repo |
| Native permission prompt (scenario 2) | OBSERVED — `Read demo.env` prompt and `Pending 1`; decision left to a human |
| Failure → recovery prompts (scenario 3) | PARTIAL — failure observed (`npm test` 3 pass / 1 fail); recovery prompt not run (blocked on the permission decision) |
| Live running → completed transition (scenario 1) | PASS after convergence — transient green dots on completed agents fixed by the terminal-id latch |

Environment note: an earlier host `AI.Error.QuotaExceeded: Free usage limit
reached` (2026-11-24 16:49Z) blocked new runs; the later delegation succeeded.
Agent Monitor surfaces an observed `HOST QUOTA LIMIT` notice rather than
inventing quota numbers or retrying. See `docs/COMPATIBILITY_REPORT.md` in the
parent project.
