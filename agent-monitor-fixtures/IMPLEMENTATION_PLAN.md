# Fake implementation plan

## Goal

Provide live, observable scenarios for Agent Monitor.

## Steps

1. Define `orchestrator` as the primary agent and four subagents in
   `.opencode/agents/`.
2. Add a harmless `demo.env` that triggers a native permission prompt when read.
3. Keep `npm test` intentionally failing and add `npm run test:pass` for
   recovery.
4. Maintain a nested Git repository with known added, modified, and deleted
   files.
5. Keep deterministic JSON fixtures for scenarios that cannot be produced
   quickly in a live session.

## Acceptance criteria

- Four subagents can be launched from the orchestrator.
- A permission request is observable and resolved by a human.
- A failure is followed by an observed recovery.
- Changed files are visible through VCS status.
- Usage and harness evidence appear in the monitor.

## Out of scope

- Real network calls.
- Real credentials or secrets.
- Production code.
