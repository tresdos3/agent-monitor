# Agent Monitor Fixtures

A deliberately fake project used **only** to test Agent Monitor. It is
separate from the plugin package and contains no production code.

## Layout

```text
agent-monitor-fixtures/
├── .opencode/agents/   # live agents for hierarchy/permission/failure scenarios
├── .opencode/opencode.json
├── demo.env            # harmless file that triggers a permission prompt
├── AGENTS.md
├── PROJECT_SPEC.md
├── IMPLEMENTATION_PLAN.md
├── package.json
├── src/
├── tests/
├── docs/
└── fixtures/           # deterministic scenario inputs
```

## Setup

```sh
cd agent-monitor-fixtures
npm install
npm test          # expected: 3 pass, 1 fail
npm run test:pass # expected: pass
```

This directory is its own Git repository. Its working tree is intentionally
dirty:

- modified: `src/api.ts`
- added: `src/generated.ts`
- deleted: `docs/old-notes.md`

## Live test playbook

See [`TEST_LAB.md`](TEST_LAB.md) for the complete step-by-step tutorial with
expected results for every scenario.

Load the plugin from this directory:

```sh
opencode
```

Then run these scenarios:

| Scenario | Prompt / action | Expected monitor signal |
|---|---|---|
| Hierarchy | "Use orchestrator to delegate API, tests, and docs work" | Overview: orchestrator + child agents with indentation |
| Permission | "Use backend-agent to read demo.env and edit src/api.ts" | Pending permission row; native prompt decides; no auto-approve |
| Failure | "Use test-agent to run npm test" | Failed tool/execution events and failed counter |
| Recovery | "Use recovery-agent to run npm run test:pass" | Success event after failure |
| Git | Check Project context | Branch plus added/modified/deleted files |
| Usage | After model calls | Tokens, cache, reasoning, per-agent/model usage, cost provenance |
| Harness | Tab 3 | Summary and verified/observed/declared/missing/failed groups |
| Timeline | Tab 2 | Event type, agent, timestamp, details, severity, durations |
| Narrow terminal | Shrink terminal | Single column, no shortcut labels, no timestamp column |
| Missing evidence | Copy `fixtures/missing-evidence/` outside this repo and open there | `Missing` / `Unavailable` states |

## Important

Fixture simulation is **not** real host integration. These agents and Git
states are designed for live validation against host TUI v2.4.1. Static JSON
fixtures remain in `fixtures/` for deterministic unit tests.

See `docs/FAKE_REPOSITORY.md` and `docs/TESTING_STRATEGY.md` in the parent
project.
