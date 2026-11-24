# MVP Breakdown

Status key: ✅ implemented in Phase 0 · ⏳ pending · 🔶 partially implemented.

## P0 — Required MVP

- [x] Official SDK compatibility spike — ✅ `COMPATIBILITY_REPORT.md`
- [x] Plugin package — ✅ `package.json` with `exports`
- [x] TUI entry point — ✅ `src/tui.tsx`
- [x] Persistent sidebar or closest supported equivalent — ✅ slot + canary + panel/route
- [x] Agent overview — ✅ counts from observed/derived state
- [x] Agent hierarchy — ✅ `selectAgentTree` + sidebar section
- [x] Agent statuses — ✅ observed outcomes/statuses, `Unavailable`/unknown otherwise
- [x] Current activity when available — ✅ tool observed, file inferred
- [x] Session navigation — ✅ palette commands to native sessions
- [x] Permission visibility — ✅ pending list with derived labels
- [x] Native permission handling — ✅ display + native prompt navigation only
- [x] Basic token usage when available — ✅ usage adapter + panel
- [x] Loading and empty states — ✅ sidebar states
- [x] Unsupported data states — ✅ `Unavailable` and explicit labels
- [x] Bounded event timeline — ✅ 200-event reducer + panel display
- [x] Subscription cleanup — ✅ in spike
- [x] Fake repository — ✅ scaffold + 8 scenarios
- [x] Unit tests — ✅ 51 unit tests
- [x] Integration tests — ✅ 6 integration tests
- [x] Installation documentation — ✅ global and project-local guides

## P1 — Observability Expansion

- [x] Timeline panel — ✅ bounded, filtered, deduplicated
- [x] Token breakdown — ✅ full input/output/reasoning/cache/total
- [x] Cost estimates with provenance — ✅ opt-in, source/version/date
- [x] Git status — ✅ branch from observed VCS info
- [x] Changed-file overview — ✅ added/modified/deleted counts
- [x] Failure explorer — ✅ severity=error timeline filter
- [x] Session history — ✅ palette command via native session navigation
- [x] Compact mode — ✅ persistent setting and palette toggle

## P2 — Development Intelligence

- [x] Harness Inspector — ✅ local evidence checks
- [x] Acceptance criteria checks — ✅ spec section detection
- [x] Test evidence — ✅ observed shell tool outcomes only
- [x] Quality dashboard — ✅ counts by evidence level
- [ ] Dependency graph
- [ ] Run comparison
- [ ] Diagnostics export
- [ ] Configurable alerts
- [ ] Persistent local history

## P3 — Advanced Features

- [ ] Cross-project overview
- [ ] Custom observability adapters
- [ ] Optional advanced integrations
- [ ] Configurable policies
- [ ] Extended historical analytics
