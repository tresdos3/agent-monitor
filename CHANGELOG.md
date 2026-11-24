# Changelog

All notable changes to this project are documented here.

## [Unreleased]

### Added

- Observed host quota handling: a `HOST QUOTA LIMIT` section in the Overview
  panel and sidebar when a failure event contains quota/limit language. It is
  labeled `observed`; no estimate, retry, or agent-state change is invented.

### Fixed

- Agent definitions now link to the **newest** session for their agent ID, so a
  stale running session cannot turn a completed agent green. The Overview
  `Running` metric now uses definition-derived counts like the rest of the panel.
- Project/VCS refresh is location-scoped via `vcs.get`/`vcs.status` with
  `location.directory`, and the integration mock mirrors that client surface.
- RPC history hydration: normalized events no longer emit explicit
  `undefined` optional keys, which caused `rpc.invalid_output` (HTTP 500) when
  an event had no `sessionID` or `location`. Verified with a fresh host server:
  the RPC now returns HTTP 200 with valid JSON.
- Terminal session IDs are latched so a late `session.status: busy` cannot
  briefly turn a completed agent green again. A new execution clears the latch.
  Found by a live scenario 1 delegation run and covered by an integration test.

### Changed

- Added regression coverage for duplicate agent IDs (stale running + newer
  completed), RPC-safe normalization, and quota detection; extended the LAB
  verifier with harness evidence labels, a visible changed-file check, and a
  60×30 resize survival check.

## [1.0.0] — 2026-11-23

### Phase 5 — Stabilization and Distribution

- Added `npm run verify:compat` and `prepublishOnly` checks; the installed
  host version must match the pinned `@opencode/plugin` dependency.
- Added stability tests for 5,000-event volumes, 100 sessions, degraded RPC
  and VCS capabilities, and 50 repeated setup/cleanup cycles.
- Package contents verified with `npm pack --dry-run`; test sources are
  excluded from the published tarball.
- Finalized global and project-local installation documentation.
- All documentation updated to reflect the released feature set.

Added the MIT `LICENSE`, so anyone may use, modify, and distribute the plugin.

npm publishing still requires explicit owner approval.

## [0.4.0] — 2026-11-23

### Added — Phase 4 Harness Inspector

- Evidence model with `verified`, `observed`, `declared`, `missing`, and
  `failed` levels.
- Local-file inspector for project instructions, specification, plan,
  acceptance criteria, tests, changed files, out-of-scope paths, and human
  approval checkpoints.
- Observed test/build command outcomes are `verified`; agent text is never
  treated as verified evidence.
- HARNESS section and quality-dashboard counts in the monitor panel.
- Palette command `Agent Monitor: harness inspector`.
- Unit tests for all evidence levels using the fake repository.

### Fixed

- HarnessPanel crashed in the plugin route because Solid's `Show` was missing
  the `keyed` flag, passing an accessor instead of the report value.

## [0.3.0] — 2026-11-23

### Added — Phase 3 Usage and Project Intelligence

- Usage adapter with full token breakdown, total, reported cost, and
  `Unavailable` for missing values.
- Opt-in estimated cost (`showEstimate`, default false) with explicit source,
  version, and date provenance; ambiguous pricing tiers yield `Unavailable`.
- VCS adapter for branch and changed files via `vcs.info` / `vcs.status`.
- Test/build evidence from observed shell tool calls only; agent text is never
  treated as verified evidence.
- `UsagePanel` with USAGE, PROJECT, and TESTS/BUILD sections.
- Compact mode (`compact`, default false) and session-history palette command.
- Unit tests for usage, pricing, VCS, and test evidence; integration test
  updated for settings, VCS, and model data.

## [0.2.0] — 2026-11-23

### Added — Phase 2 Events and Permissions

- Server part event collection via `ctx.event.subscribe`, location-scoped and
  bounded to 500 normalized events, exposed through the `AgentMonitor` RPC
  `history` method and `normalized` push event.
- TUI hydration from RPC history, live `context.data.on` events, and dedupe by
  `event.id` in `src/application/timeline.ts`.
- Timeline panel with filters by agent, event kind, and severity; filters are
  persisted with `storage.memory` and can be cleared.
- Display-only permission center with native-prompt navigation commands. No
  custom approval or rejection controls, and no auto-approval.
- `PermissionView` adapter using observed `permission.asked` timestamps or
  `Unavailable`.
- Unit tests for timeline dedupe/merge/filter and permission mapping;
  integration tests for RPC hydration and permission commands.

### Added — close-control fixes

- `Ctrl+G` toggles the monitor panel or route closed.
- `Esc` and `q` close the panel while focused; `Esc` closes the monitor route.
- Palette command `Agent Monitor: close` for panel and route fallback.
- Panel focus is requested on open so focused-panel keybindings activate.
- Bounded timeline display consistently shows `200` events.

## [0.1.0] — 2026-11-23

### Added — Phase 1 Agent Command Center

- `src/application/selectors.ts` for overview counts, agent tree ordering,
  current activity with evidence labels, session event selection, and stale
  detection.
- `src/adapters/sessions/session.ts` mapping `SessionInfo` into SDK-independent
  `SessionLike`.
- `src/ui/sidebar/Sidebar.tsx` with overview, hierarchy, current activity,
  usage, loading/empty/error/unsupported states.
- `src/ui/panels/MonitorDetail.tsx`, `src/ui/navigation/commands.ts`, and
  session navigation commands using `router.navigate({ type: "session" })`.
- Unit tests for selectors, session adapter, and navigation commands;
  integration test now covers 11 event subscriptions.

### Changed

- Bounded timeline limit raised to 200 events.
- Load toast text is now `Agent Monitor loaded`.

## [0.0.1-phase0] — 2026-11-23

### Added

- Compatibility research against host TUI v2.4.1 and the official V2 plugin,
  TUI, RPC, and permission APIs (`docs/COMPATIBILITY_REPORT.md`).
- Package skeleton with pinned `@opencode/plugin@2.4.1` and
  `@opencode/client@2.4.1` dependencies.
- Minimal TUI spike (`src/tui.tsx`) with a `sidebar.content` contribution,
  a `session.execution.started` subscription, a Solid signal, a `Ctrl+G`
  command, and cleanup.
- Empty server part (`src/index.ts`) and reserved RPC contract (`src/rpc.ts`).
- Pure domain/normalizer/reducer modules with unit tests.
- Integration test that verifies plugin setup and cleanup with a mocked TUI
  context.
- Separate fake repository `agent-monitor-fixtures/` with deterministic
  fixtures for all eight required scenarios.
- All required documentation, `README.md`, `AGENTS.md`, and
  `PROJECT_STATUS.md`.

### Changed

- Upgraded the development requirement to Node >=26.4.0 to match OpenTUI's
  declared engine range; Node v26.13.1 is now used and `npm install` no longer
  reports `EBADENGINE`.
- Replaced the `Ctrl+G` ping binding with `Ctrl+G` → open monitor; ping is now
  palette-only.

### Added (approved fallback improvements)

- Always-visible `home.footer.status` canary.
- `session.panel` contribution and plugin-route fallback so the monitor is
  reachable when the native sidebar is hidden or narrow.
- Early permission count and usage read-outs using native the host TUI data APIs.
- Explicit `derived waiting` and `unattributed` labels; missing usage/cost
  still shows `Unavailable`.

### Known limitations

- Sidebar visibility is still controlled by the host TUI's `session.sidebar`
  setting, but a footer canary and panel/route fallback now exist.
- No server-side event collection, full permission center, Git panel, or
  Harness Inspector yet.
- `LICENSE` intentionally omitted pending owner selection.
