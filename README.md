# Agent Monitor

Full Development Observability for the host TUI.

A standalone plugin that observes agents, tools, permissions, usage, project
changes, and evidence directly inside the host TUI's native right sidebar. No web
dashboard, no Electron app, no external backend in the MVP.

**Current state: v1.0.0, all phases code complete.** The plugin provides agent
observability, a bounded filterable timeline with server history, a display-only
permission center, usage/cost provenance, Git and test evidence, and a Harness
Inspector with a quality dashboard. Packaging is verified with
`npm pack --dry-run`. The project is MIT-licensed; npm publishing awaits owner
approval. See `docs/ROADMAP.md` and `PROJECT_STATUS.md`.

## Quick start (Phase 1)

Development requires Node >=26.4.0 (verified with v26.13.1).

```sh
npm install
npm run typecheck
npm test
```

Load without touching your global config:

```sh
cd agent-monitor-fixtures
opencode
```

Expected: an `Agent Monitor loaded` toast, the `AGENT MONITOR` sidebar with
overview/hierarchy/activity/usage sections, a `MONITOR 0● 0◷` footer canary,
and `Ctrl+G` toggling the monitor panel or plugin-route fallback. `Esc`/`q`
close the panel while focused, `Esc` closes the route, and `Agent Monitor:
close` is in the palette.

## Documentation

- `docs/PRODUCT_SPEC.md` — product vision and modules
- `docs/ARCHITECTURE.md` — layers and data flow
- `docs/UI_DESIGN.md` — sidebar concept and states
- `docs/IMPLEMENTATION_PLAN.md` — phase tasks and gates
- `docs/MVP_BREAKDOWN.md` — P0–P3 checklists
- `docs/COMPATIBILITY_REPORT.md` — verified host TUI v2.4.1 API findings
- `docs/TESTING_STRATEGY.md` — test layers and scenario mapping
- `docs/FAKE_REPOSITORY.md` — separate test project
- `docs/INSTALLATION.md` — loading instructions
- `docs/PUBLISHING.md` — npm and GitHub release steps
- `docs/AUTOMATED_TEST_LAB.md` — scripted LAB verification
- `docs/ROADMAP.md` — phase overview
- `PROJECT_STATUS.md` — what is actually done

## Non-negotiables

- No fabricated agent status, token usage, or cost.
- No automatic permission approval.
- `Unavailable` instead of guessed values.
- Agent self-reports are `declared`, never `verified`.
- Clean up subscriptions and keep event history bounded.
