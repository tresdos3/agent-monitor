# Implementation Plan

Work is sequential. Do not start the next phase without explicit approval.
Each phase ends with tests, updated docs, and `PROJECT_STATUS.md`.

## Phase 0 — Compatibility and research ✅ Complete

Delivered:

- Workspace/version/API compatibility report (`COMPATIBILITY_REPORT.md`).
- Package skeleton with pinned the host TUI 2.4.1 dependencies.
- Minimal TUI spike: sidebar slot, event subscriptions, Solid signals, keymap,
  cleanup.
- Approved fallbacks: `home.footer.status` canary, `session.panel` contribution,
  plugin route fallback, and `Ctrl+G` open command.
- Early permission count and usage read-outs with `Unavailable` and
  derived/inferred labels.
- Node toolchain upgraded to v26.13.1 and `engines.node` set to `>=26.4.0`.
- Pure normalizer and reducer with unit tests.
- Integration test with a mocked TUI context.
- Separate fake repository scaffold with eight scenario fixtures.
- `npm run typecheck` and `npm test` passing (14 tests).

Acceptance criteria still requiring a human:

- [ ] Load the plugin in a real host v2.4.1 TUI and see the sidebar text.
- [ ] Confirm the `MONITOR` footer canary.
- [ ] Start a session and observe the event counter increase.
- [ ] Press `Ctrl+G` and see the monitor panel (or route fallback).
- [ ] Verify global load via `cli.json` and project-local load via `opencode.json`.

## Phase 1 — Agent Command Center ✅ Code complete

Delivered:

- `src/application/selectors.ts`: overview, tree, activity, stale detection.
- `src/adapters/sessions/session.ts`: `SessionInfo` → `SessionLike`.
- `src/ui/sidebar/Sidebar.tsx`: overview, hierarchy, activity, usage, and
  loading/empty/error/unsupported states.
- `src/ui/panels/MonitorDetail.tsx`, `src/ui/navigation/commands.ts`.
- Session navigation via `context.ui.router.navigate({ type: "session", sessionID })`.
- Tests: selectors, session adapter, navigation commands, integration;
  fake scenarios 1 and 8 exercised by unit tests.
- `npm run typecheck` and `npm test` passing (24 tests).

Acceptance criteria still requiring a human:

- [ ] Live rendering of overview, tree, and activity sections.
- [ ] Per-agent palette commands open the native session.
- [ ] Stale badge appears for a stale session.
- [ ] Counters update during a real multi-agent session.

**Gate:** Phase 2 requires explicit approval.

## Phase 2 — Events and Permissions ✅ Code complete

Delivered:

- `src/application/timeline.ts`: dedupe by event ID, merge live + RPC history,
  filter by agent/kind/severity, bounded to 200 UI / 500 server events.
- `src/rpc.ts`: `history` method and `normalized` event on the `AgentMonitor`
  contract.
- `src/index.ts`: `ctx.event.subscribe` with abort cleanup, location-scoped
  bounded buffer, RPC registration and emission.
- TUI hydration from RPC history plus `context.data.on` live events; graceful
  degradation when RPC is unavailable.
- `src/adapters/permissions/permission.ts`: `PermissionView` from native
  `PermissionRequest` and `permission.asked` events; timestamp from the event
  or `Unavailable`.
- Timeline panel with filter commands (`dialog.select`) and `storage.memory`
  persistence; failure explorer via severity filter.
- Display-only permission center: pending list plus commands that navigate to
  the native prompt. No auto-approval and no second permission system.
- Tests: timeline/permission units, RPC hydration/dedupe integration, fake
  scenarios 2, 3, 7. `npm run typecheck` passes; 37 tests pass.
- Manual verification still required: RPC history appears in a live TUI,
  filters work, and a real permission prompt populates the permission list.

**Gate:** Phase 3 requires explicit approval.

## Phase 3 — Usage and Project Intelligence ✅ Code complete

Delivered:

- `src/adapters/usage/usage.ts` and `pricing.ts`: token breakdown, reported
  cost, and opt-in estimated cost with source/version/date provenance.
- `src/adapters/git/vcs.ts`: branch and changed files via `vcs.info/status`;
  `Unavailable` when no repository.
- `src/adapters/project/test-evidence.ts`: observed shell test/build commands
  with evidence levels; no agent-claim verification.
- Settings in `storage.store`: `compact` (default false) and `showEstimate`
  (default false, as approved).
- Compact mode command and session-history navigation commands.
- Tests: fake scenarios 4, 5, 6, 7. `npm run typecheck` passes; 48 tests pass.
- Manual verification still required: usage/project panels in a live TUI,
  opt-in estimate display, compact mode, and observed test evidence.

**Gate:** Phase 4 requires explicit approval.

## Phase 4 — Harness Inspector ✅ Code complete

Delivered:

- `src/domain/harness.ts` evidence model with the five evidence levels.
- `src/adapters/harness/inspector.ts`: local file reads for `AGENTS.md`,
  project spec, implementation plan, acceptance criteria, tests, changed files,
  out-of-scope paths, and human approval checkpoints.
- Quality dashboard section in the monitor panel with counts per evidence level.
- Palette command `agent-monitor.harness` to open the panel.
- Tests: every evidence level, especially "agent claim ≠ verified".
  `npm run typecheck` passes; 52 tests pass.
- Manual verification still required: HARNESS section in a live TUI with real
  project files.

**Gate:** Phase 5 requires explicit approval.

## Phase 5 — Stabilization and Distribution ✅ Code complete

Delivered:

- `scripts/verify-compat.mjs` plus `npm run verify:compat` to assert the
  installed host version matches the pinned SDK dependency.
- Stability tests: large event volumes, many sessions, repeated setup/cleanup
  cycles, and degraded SDK capabilities (no RPC / no VCS).
- Finalize `INSTALLATION.md` for global and project-local installs.
- `npm pack --dry-run` verification and `prepublishOnly` checks.
- Documentation consistency pass and release notes.
- MIT `LICENSE` added and included in the package.

- `npm run verify:compat` passes; `npm pack --dry-run` produces a 65-file
  tarball; 94 tests pass across 16 files.
- Manual verification in a live TUI is still recommended before publishing.

**Gate:** npm publishing requires explicit owner approval and has not been
performed.

## Definition of done

A feature is done only when implementation, tests, limitation docs, UI states,
declared-version verification, fake-repository reproduction, and honest
labeling all exist.
