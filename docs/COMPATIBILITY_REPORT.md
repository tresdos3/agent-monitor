# Compatibility Report

**Target:** host TUI v2.4.1 (verified locally via `opencode --version`).
**Date:** 2026-11-23.
**Status:** Phase 0 research complete; spike implemented and tested.

## Environment

| Item | Value |
|---|---|
| Binary | `/opt/homebrew/Cellar/opencode-v2/2.4.1/bin/opencode` |
| Service | `http://127.0.0.1:49374` (raw REST requires auth) |
| Node (dev) | v26.13.1 (via fnm), satisfies OpenTUI `>=26.4.0` |
| `@opencode/plugin` | 2.4.1 |
| `@opencode/client` | 2.4.1 |
| `@opencode/schema` | 2.4.1 |
| OpenTUI peer | `>=0.8.0` (installed 0.9.9 for typechecking) |
| solid-js peer | `>=1.9.0` |

The local `~/.config/opencode` directory contains a **V1** plugin
(`herdr-agent-state.js`, using `chat.message`, `tool.execute.before`,
`session.updated`) and an older-V2 TUI plugin using the plain-object API
(`api.route.current`, `api.state.session.get`). Neither is a valid pattern for
this project. We target the current V2 `Plugin.define` API from the official
documentation.

## Sources

- <https://opencode.ai/docs/build/plugins/>
- <https://opencode.ai/docs/build/plugins/server/>
- <https://opencode.ai/docs/build/plugins/cli/>
- <https://opencode.ai/docs/build/plugins/rpc/>
- <https://opencode.ai/docs/cli/plugins>
- <https://opencode.ai/docs/cli/config>
- <https://opencode.ai/docs/permissions>
- <https://opencode.ai/docs/openapi.json>
- Published type definitions: `@opencode/plugin@2.4.1`, `@opencode/client@2.4.1`, `@opencode/schema@2.4.1`

## Plugin parts

A plugin package is loaded through `exports`:

- `.` / `./server` — `@opencode/plugin`, `Plugin.define({ id, setup })`
- `./tui` — `@opencode/plugin/tui`, own `id`, `setup(context)` returning optional cleanup
- `./rpc` — `@opencode/plugin/rpc`, `Rpc.define`
- `./gui-experimental` — out of scope

Loading:

- Global CLI plugin: `cli.json` `plugins` array.
- Global server+TUI plugin: `~/.config/opencode/opencode.json(c)` `plugins`.
- Per-project: `opencode.json(c)` `plugins`, or `.opencode/plugins/<name>/{index.ts,tui.ts}`.
- There is no project-local `cli.json`, so a TUI-only plugin cannot be configured per project via `cli.json`.

## Sidebar support

Confirmed. `context.ui.slot({ append: "sidebar.content", render })` contributes to
the native session sidebar; `sidebar.footer` is also available. Slot inputs are
typed: `sidebar.content` receives `{ sessionID }`.

Limitations:

- `session.sidebar` is `auto` or `hide` in `cli.json`; the sidebar may be
  absent in narrow terminals or non-session views.
- Supported fallback: `session.panel` (host-managed side/fullscreen panel), a
  plugin route via `context.ui.router.register`, or `home.footer.status`.

## Events

TUI: `context.data.on(type, handler)` and `context.data.listen(handler)` both
return unsubscribe functions. Server: `ctx.event.subscribe({ types, signal })`.
`server.connected` is not delivered to plugins inside the server.

The V2 event union contains 101 types. The monitor uses:
`session.created`, `session.forked`, `session.agent.selected`,
`session.execution.*`, `session.status`, `session.deleted`,
`session.tool.input.started`, `session.tool.called`, `session.tool.*`,
`session.step.*`, `permission.asked`, `permission.replied`,
`form.created|replied|cancelled`, `session.usage.updated`,
`filesystem.changed`, `vcs.branch.updated`.

High-frequency events (`session.text.delta`, `session.reasoning.delta`,
`session.step.streamed`, `session.tool.input.delta`) are dropped before they
can reach the render path.

## Agents and sessions

V2 has no global "agent run" object. An agent is a session's `agent` ID, and
hierarchy comes from `Session.Info.parentID` / `session.forked`. `Session.Info`
exposes `cost`, `tokens`, `outcome` (`succeeded|failed|interrupted`), and
`time.{created,updated,busy,idle}`. `data.session.status()` returns only
`idle | running`. There is no first-class "waiting" state.

## Permissions

`permission.asked` and `permission.replied` events, plus
`context.data.session.permission.list(sessionID)`. Native reply is reachable
from the TUI part:

```ts
context.client.permission.reply({
  sessionID,
  requestID,
  decision: "once" | "always" | "reject",
  message?,
})
```

The monitor must only display requests and point to the host TUI's native prompt.
It must never auto-approve or implement a second approval system.

## Usage and cost

`session.usage.updated` carries `data.cost` (USD number) and `data.tokens`
with `input`, `output`, `reasoning`, `cache.read`, `cache.write`. These are
server-reported values. The event has no pricing version/date, so any
monitor-computed estimate must be labeled **Estimated** with its own pricing
provenance.

## VCS

`context.data.location.vcs.info(location?)` (branch), and
`context.client.vcs.get()/status()/branch.list()/diff()`. Both `get` and
`status` accept `{ location: { directory } }`, which the monitor passes so
project state is scoped to the active location rather than the process default.
`Vcs.FileStatus` is `{ file, status: added|deleted|modified, additions, deletions }`.

## Host quota / free usage limits

Host v2.4.1 has **no dedicated quota event**. A free-model usage limit is
delivered as a generic `session.execution.failed` whose `error` is a
`Session.StructuredError` with free-form `type` and `message`; the same shape is
used by `session.step.failed`, `session.tool.failed`, `session.retry.scheduled`,
and `session.status` retry actions. `client.experimental.usage.limits()` exists
but returns `data: null` for workspaces without an OpenCode Go subscription or
budget, so it cannot report free-model quota state here.

The monitor therefore reports only what it observes: `quotaNoticeFromEvents()`
matches quota/limit/subscribe language in failure `error.type`/`error.message`
and renders a `HOST QUOTA LIMIT` section in the Overview panel and sidebar. It
never invents a percentage, retry time, or quota number, never retries a model
call, and never changes agent state. Evidence is labeled `observed`.

## Unresolved / documented limitations

1. Sidebar visibility is user-controlled and layout-dependent.
2. `filesystem.changed` has no `sessionID`; file→agent attribution is inferred only.
3. `session.tool.called` has no tool name; the name is in `session.tool.input.started`.
4. No test/build result events; only shell tool observation is possible.
5. "Waiting" agents must be derived from pending permissions/forms.
6. Local REST API is authenticated; tests use the generated client or `opencode api`.
7. ~~OpenTUI Node engine mismatch.~~ **Resolved:** Node v26.13.1 is now
   installed and satisfies the `>=26.4.0` requirement of OpenTUI 0.9.9 and
   other 0.6.x–0.9.x releases. `package.json` `engines.node` is now
   `>=26.4.0`; `npm install` no longer reports `EBADENGINE`.
8. Quota detection relies on free-form error text because v2.4.1 has no typed
   quota event; unrelated failures with similar wording could match. The notice
   is a visual hint only and never alters agent state.
9. On a fresh host server the RPC endpoint can briefly return
   `rpc.unavailable` while plugins are still loading. The TUI degrades to
   `History live-only` and continues with live `context.data.on` events.

## Adopted mitigations

- Sidebar absence is mitigated by an always-visible `home.footer.status`
  canary and a `Ctrl+G` command that opens a `session.panel` or plugin route.
- Waiting state is never invented: the UI labels pending permissions as
  `derived waiting`, and file activity as `unattributed`.
- Permission and usage read-outs use native APIs only; no independent
  approval system or pricing database was added.
- Phase 2 uses `ctx.event.subscribe({ types, signal })` in the server part and
  `context.client.rpc(AgentMonitor).events.on("normalized", ...)` in the TUI,
  with `history()` hydration. `context.data.on` remains the live source;
  events are deduplicated by `event.id` to avoid double counting.
- Normalized events omit absent optional keys instead of emitting
  `key: undefined`. The RPC output schema rejects explicit `undefined` values,
  which previously made `history()` fail with `rpc.invalid_output` whenever an
  event had no `sessionID` or `location`.
- Quota notices are derived from observed failure text and rendered as an
  `observed` hint; no number, retry, or agent-state change is invented.
- `PermissionRequest` has no `created` field, so permission timestamps come
  from the observed `permission.asked` event or render as `Unavailable`.
- Phase 3 uses `context.client.vcs.get()` and `vcs.status()` with the active
  `location.directory`; the status response wraps the file list as
  `{ location, data: Vcs.FileStatus[] }` and the get response as
  `{ location, data: VcsInfo }`.
- Usage events carry no pricing version/date; the monitor maintains a dated
  pricing-snapshot constant and labels all computed figures `Estimated`.
- Phase 4 inspects project files from the CLI process's local location. For a
  remote server location, the inspector reports `Unavailable` rather than
  claiming to read server-side files.
- Loading through `cli.json` starts only the TUI part, so RPC history is
  unavailable and the status line shows `History live-only`. Loading through
  `opencode.json(c)` loads both parts and enables `History ready`. Environment
  variable substitution for a plugin path is unreliable because the background
  server may not inherit CLI env vars; use a literal path in the fixture config.
