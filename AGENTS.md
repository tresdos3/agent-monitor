# Agent instructions

Work in this repository as an engineering agent, not a proposal writer.

## Before changing anything

1. Inspect the current file and surrounding code.
2. Verify the installed host version with `opencode --version`.
3. Verify SDK imports against `@opencode/plugin@2.4.1` and
   `@opencode/client@2.4.1`; do not invent event names, slots, or commands.
4. Read `docs/COMPATIBILITY_REPORT.md` and `docs/ARCHITECTURE.md`.

## Working rules

1. Start with the current phase only; do not skip phases.
2. Create documentation before implementation.
3. Build a minimal working slice before expanding.
4. Use `agent-monitor-fixtures/` for repeatable scenarios; keep fixture
   simulation separate from real host adapters.
5. Run `npm run typecheck` and `npm test` after every meaningful change.
6. Never claim a feature works without testing it.
7. Record unsupported features and blockers in `docs/COMPATIBILITY_REPORT.md`.
8. Keep `PROJECT_STATUS.md` updated.
9. Request human approval before starting the next major phase.
10. Never fabricate agent status, tokens, cost, or file authorship.
11. Never auto-approve permissions or persist prompts/secrets.
12. Unsubscribe from events and dispose slots on plugin unload.

## Current phase

Phase 5 code is complete. npm publishing and LICENSE selection require owner
approval.
