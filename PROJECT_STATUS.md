# Project Status

**Last updated:** 2026-11-25
**Declared host version:** v2.4.1 (verified by `pnpm verify:compat`)
**Dev toolchain:** Node v26.13.1 (fnm), pnpm 12.4.2
**Current phase:** Phase 5 — code complete
**Release status:** MIT-licensed; installable from GitHub via
`opencode plugin add github:tresdos3/agent-monitor#main`; npm registry publish
still requires explicit owner approval (the original name is taken on npm).

## What actually works (tested)

- `pnpm verify:compat` passes: the host TUI 2.4.1 matches `@opencode/plugin@2.4.1`.
- `pnpm typecheck` passes.
- `pnpm test` passes: 101 tests across 17 files, including stability tests for
  5,000 events, 100 sessions, degraded RPC/VCS, and 50 cleanup cycles.
- `pnpm test:lab` passes on 2026-11-25: 27 passed, 0 failed, 0 warnings
  (static config, fixture baseline, API assertions, and the tmux TUI harness).
- pnpm migration verified: `packageManager: pnpm@12.4.2`, `pnpm-lock.yaml`,
  `pnpm-workspace.yaml` with the esbuild build-script allowlist; no
  `package-lock.json`. `pnpm peers check` reports no issues.
- RPC history verified against a fresh host server: `POST
  /api/rpc/agent-monitor/history` returns HTTP 200 with valid JSON after
  omitting `undefined` optional keys from normalized events.
- Free-model quota notice handling added: observed failure text produces a
  labeled `HOST QUOTA LIMIT` hint in the Overview panel and sidebar.
- Live fixture Overview check on 2026-11-24: `Agents 5  Running 0  Pending 0`,
  five `✓` completed agent rows, `COMPLETED 5 / FAILED 0`.
- `pnpm pack --dry-run` produces a 65-file, ~55.1 kB tarball; test sources are
  excluded.
- All product modules are implemented:
  - agent overview, hierarchy, activity, session navigation
  - bounded, filterable timeline with RPC history
  - display-only permission center using native prompts
  - token/cost breakdown with opt-in estimates and provenance
  - Git status and observed test/build evidence
  - Harness Inspector with evidence levels and quality dashboard
  - observed host quota-limit notice (no invented numbers or retries)
- All event subscriptions, RPC listeners, slots, and the server stream are
  cleaned up on unload.

## Manual verification still recommended

- Fresh delegation walkthrough in host TUI v2.4.1 (sidebar, panel, filters,
  harness) to observe the running → completed transition.
- Terminal resizing and narrow-layout fallback.
- Real multi-session and multi-location behavior.

## Delivered files

- `a290acd` — initial release of Phases 0–5.
- `84a80e7` — automated LAB verifier and TUI harness.
- `54181cd` — stale-agent-state fix and location-scoped VCS refresh.
- Phase 5 additions: `scripts/verify-compat.mjs`, stability/degradation tests,
  finalized installation and release docs.
- Package version: `1.0.0`.
- Fake repository `agent-monitor-fixtures/` with 8 scenario fixtures.
- All required documentation.

## Deliberately not delivered

- npm publish — requires explicit owner approval.
- Diagnostics export, configurable alerts, dependency graph, run comparison,
  extended historical analytics (P2/P3 scope).

## Open bugs

- None.
- `docs/BUG-agent-state-stale.md` — fixed and retained as a regression record.
  Counters and glyphs were confirmed live; a fresh delegation walkthrough is
  still recommended.

## Known limitations

- Sidebar visibility is controlled by the host TUI; panel/route fallback exists.
- Remote servers need the server part installed for RPC history.
- Harness file reads are local to the CLI process.
- Pricing is a dated snapshot; ambiguous tiers show `Unavailable`.
- `context.client` changes after a server restart; resubscription is future work.
