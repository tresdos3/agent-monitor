# Missing-evidence test location

This directory intentionally has no `AGENTS.md`, `PROJECT_SPEC.md`, or
`IMPLEMENTATION_PLAN.md`.

Copy this directory outside the fake repository before opening the host with
the monitor plugin, otherwise the host may discover the parent repository's
instruction files. Then the Harness tab should show `Missing` / `Unavailable`
states instead of fabricated evidence.
