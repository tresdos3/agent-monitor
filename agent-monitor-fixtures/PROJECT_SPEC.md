# Fake project specification

## Goal

Provide repeatable inputs for Agent Monitor scenarios.

## Acceptance criteria

1. A hierarchy of four sessions exists: `orchestrator`, `backend-agent`,
   `test-agent`, and `docs-agent`.
2. At least one child session requests a permission that maps to a tool call.
3. At least one child session fails and another session recovers.
4. Usage fixtures include input, output, reasoning, and cache tokens, plus a
   second fixture with missing usage data.
5. Git status fixtures include added, modified, and deleted files.
6. Test fixtures include a pass and a failure, plus an agent claim with no
   observed test run.
7. Stale-session and unknown-capability fixtures exist.

## Out of scope

- Real network calls.
- Real credentials or secrets.
- Real production code.
- Generated output under `dist/**`.
- Vendored code under `vendor/**`.
- Secret fixtures under `secrets/*`.
