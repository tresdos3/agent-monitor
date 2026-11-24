# Fake Repository

`agent-monitor-fixtures/` is a separate, private npm package used exclusively
to exercise Agent Monitor. It is not part of the plugin package and
contains no production code.

## Layout

```text
agent-monitor-fixtures/
├── .opencode/
│   ├── agents/{orchestrator,backend-agent,test-agent,docs-agent,recovery-agent}.md
│   └── opencode.json
├── demo.env
├── README.md
├── AGENTS.md
├── PROJECT_SPEC.md
├── IMPLEMENTATION_PLAN.md
├── package.json
├── src/{api,database,services,generated}.ts
├── tests/{api,services}.test.ts
├── docs/architecture.md
└── fixtures/
    ├── agents/         scenario 1
    ├── events/         scenarios 1 and 3
    ├── permissions/    scenario 2
    ├── usage/          scenarios 4 and 7
    ├── git/            scenario 5
    ├── tests/          scenario 6
    └── failures/       scenarios 7 and 8
```

## Scenario contract

- **1 — Multi-agent execution:** four sessions, one root and three children.
- **2 — Permission:** edit request linked to a tool call; native decisions
  `once|always|reject`; monitor displays only.
- **3 — Failure and recovery:** `tool.failed` → `execution.failed` → recovered
  fork → `execution.succeeded`.
- **4 — Usage:** deterministic token counts and cost with pricing metadata;
  totals must be checked.
- **5 — Git:** added, modified, and deleted files; explicit note that
  `filesystem.changed` lacks a session ID.
- **6 — Tests:** an observed pass/fail result alongside an unverified agent
  claim; evidence levels must differ.
- **7 — Missing observability:** missing tokens/cost/pricing and unsupported
  capabilities must render `Unavailable` or an honest fallback.
- **8 — Stale session:** old last-activity timestamp with no events; no
  fabricated status.

## Usage

The fake repository is also an independent Git repository with a deliberately
dirty working tree: `src/api.ts` modified, `src/generated.ts` added, and
`docs/old-notes.md` deleted. Its `.git/` is ignored by the parent repository.

`npm test` intentionally ends with 3 passing tests and 1 failing test so the
monitor can distinguish observed failure from a declaration. `npm run test:pass`
runs only the passing tests for the recovery scenario.

The `.opencode/agents/` definitions provide live agents for hierarchy,
permission, failure, and recovery testing. The full step-by-step live playbook
is in `agent-monitor-fixtures/README.md`.

## Separation rule

Never wire fixture data into real plugin adapters. Adapters must be validated
against a live host v2.4.1 session.
