# Architecture

## Goal

Keep domain models independent of host SDK types, normalize events once,
and keep UI components free of event-collection concerns.

## Logical layers

```text
Agent Monitor
│
├── Plugin entry
│   ├── src/index.ts     server part (id: agent-monitor)
│   ├── src/tui.tsx      TUI part (id: agent-monitor.tui)
│   └── src/rpc.ts       typed server↔TUI contract
│
├── Domain (src/domain)
│   └── AgentNode, NormalizedEvent, TimelineState, TokenUsage, EvidenceLevel
│
├── Application (src/application)
│   ├── normalize.ts     V2 event → NormalizedEvent
│   └── reducer.ts       bounded timeline + session → agent tree
│
├── Adapters (planned, src/adapters)
│   ├── opencode/        context.data / context.client wrappers
│   ├── events/          event filtering and location scoping
│   ├── sessions/        hierarchy, status, outcome
│   ├── permissions/     native list/reply passthrough only
│   ├── usage/           token/cost provenance
│   └── git/             vcs info/status/diff
│
├── UI (src/ui, planned)
│   ├── sidebar/         sidebar.content / sidebar.footer
│   ├── panels/          session.panel timeline + inspector
│   ├── components/      status indicators, empty/error states
│   └── navigation/      keymap layers, router.navigate
│
├── Storage
│   ├── durable settings: context.storage.store
│   └── bounded history: context.storage.memory
│
└── Tests
    ├── unit/            normalizer, reducer, evidence rules
    ├── integration/     mocked setup/context
    ├── tui/             manual + headless checks
    └── fixtures/        V2-shaped deterministic events
```

## Data flow (target)

1. Server part subscribes to `ctx.event.subscribe()` and reads session/VCS
   state via `ctx.*` APIs.
2. Events are normalized into `NormalizedEvent` and held in a bounded buffer.
3. The server part exposes them through the `AgentMonitor` RPC contract.
4. TUI part combines RPC events with `context.data.on` and
   `context.data.session.*` reads.
5. A pure reducer builds sidebar view models.
6. UI components render only view models and never see raw SDK events.

Only the current `context.location` is rendered; events from other locations
are ignored. Subscriptions and slots are disposed on unload.

## Phase 1 state

Phase 1 implements the Agent Command Center:

- `src/tui.tsx` orchestrates state, subscriptions, slots, routes, and keymaps.
- `src/application/selectors.ts` builds overview counts, the agent tree,
  current activity with evidence labels, and stale detection.
- `src/adapters/sessions/session.ts` maps `SessionInfo` into `SessionLike`.
- `src/ui/sidebar/Sidebar.tsx` renders overview, hierarchy, activity, usage,
  and loading/empty/error/unsupported states.
- `src/ui/panels/MonitorDetail.tsx` renders the panel/route detail view.
- `src/ui/navigation/commands.ts` creates native session-navigation commands.
- `normalize.ts` and `reducer.ts` remain pure and tested; timeline is bounded
  to 200 events.

## Phase 2 state

- `src/index.ts` subscribes to `ctx.event.subscribe`, normalizes through the
  shared `normalizeEvent`, keeps a bounded 500-event ring buffer scoped to
  `ctx.location.directory`, and exposes `history` + `normalized` via RPC.
- `src/rpc.ts` defines the `AgentMonitor` contract with an event array output
  for `history` and a `normalized` push event.
- TUI hydrates from RPC history, subscribes to RPC events, and deduplicates
  against `context.data.on` by `event.id` in `src/application/timeline.ts`.
- `src/adapters/permissions/permission.ts` maps native `PermissionRequest`
  objects and `permission.asked` events to `PermissionView`; the native prompt
  remains authoritative and no custom approval system is added.
- Filters by agent, event kind, and severity are pure functions in
  `src/application/timeline.ts` and are persisted with `storage.memory`.

## Phase 3 state

- `src/adapters/usage` maps token/cost data and computes an explicitly labeled
  estimate from dated model-cost tiers when `showEstimate` is enabled.
- `src/adapters/git/vcs.ts` maps `vcs.info` / `vcs.status` into `ProjectView`.
- `src/adapters/project/test-evidence.ts` correlates observed shell tool calls
  with success/failure events; evidence is `observed` or `declared`.
- `src/ui/panels/UsagePanel.tsx` renders usage/project sections; settings live
  in `context.storage.store("settings")`.

## Phase 4 state

- `src/domain/harness.ts` defines `HarnessCheck` and `HarnessReport`.
- `src/adapters/harness/inspector.ts` reads local project files from the
  current location and combines them with observed VCS/test evidence.
- File reads are local to the CLI process; remote-server locations report
  `Unavailable` rather than claiming to inspect server-side files.
- The monitor panel renders a quality dashboard with counts by evidence level.

## Subagent visibility

V2 subagents are child sessions (`Session.Info.parentID`). The TUI combines:

- `context.data.session.list()` plus a server `client.session.list()` fallback,
- short debounced `sync`/`invalidate` after `session.created`/`session.forked`,
- direct `session.status` event payloads (`idle | busy | retry`) mapped into
  `AgentNode.status` with an optional `statusNote`,
- a low-frequency `client.session.active()` cross-check filtered to sessions
  from the current location.

`buildAgentTree()` accepts status overrides and an active-session set so event
data wins over stale cache values. Refresh and polling timers are cleared on
plugin unload.

## Agent definitions

The primary agent list comes from the location-scoped
`context.data.location.agent.list/sync` collection, which reflects
`.opencode/agents/*.md` for the current project. `AgentInfo` is mapped into a
SDK-independent `AgentDefinition` with mode, hidden flag, and best-effort
built-in detection. Built-ins and hidden agents are excluded by default.

Each definition is linked to the first matching live session (`session.agent ===
definition.id`) so running state is observed, never invented. Durable `Session.Info.outcome` takes precedence over transient `session.status`
overrides, so completed and failed agents cannot keep a green running dot even
if a late `busy` event arrives. Overview counters are computed from agent
definitions, not every historical session. Both the client cache and the server
`session.list` fallback are filtered to `context.location.directory` before
they can link to a definition, so identically named agents from other projects
cannot turn the current project's agents green. The session tree is not
rendered; the agent definition list is the sole hierarchy view.

## Invariants

- Never fabricate agent status, tokens, or cost.
- `Unavailable` is a valid UI value.
- Agent self-reports are `declared`, never `verified`.
- No automatic permission approval.
- No prompts or file contents in persistent logs.
- Bounded history; unsubscribe on unload.
- No network dependency in the MVP.
