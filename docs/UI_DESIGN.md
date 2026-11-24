# UI Design

## Concept

A compact, persistent contribution to the native right sidebar. This is a
conceptual target, not a claim that every field is implemented in Phase 0.

```text
┌────────────────────────────────────┐
│ AGENT MONITOR                 ● LIVE│
├────────────────────────────────────┤
│ OVERVIEW                           │
│  ● Running      2                  │
│  ◷ Waiting      1                  │
│  ✓ Completed    3                  │
│  ✕ Failed       0                  │
├────────────────────────────────────┤
│ AGENT TREE                         │
│  ▾ orchestrator                    │
│    ● backend-agent                 │
│      Editing: src/api.ts (inferred)│
│    ◷ test-agent                    │
│      Permission pending            │
│    ✓ docs-agent                    │
├────────────────────────────────────┤
│ CURRENT ACTIVITY                   │
│  Agent: backend-agent              │
│  Tool: edit                        │
│  Duration: 00:02:41                │
├────────────────────────────────────┤
│ USAGE                              │
│  Input: 12.4k   Output: 3.2k       │
│  Total: 15.6k   Cost: Estimated    │
├────────────────────────────────────┤
│ PERMISSIONS                        │
│  ◷ 1 request pending               │
├────────────────────────────────────┤
│ PROJECT                            │
│  Branch: feat/agent-monitor        │
│  Changed files: 4                  │
│  Tests: 1 passed / 1 failed (obs.) │
├────────────────────────────────────┤
│ [Overview] [Timeline] [Inspector]  │
└────────────────────────────────────┘
```

## Layout modes

- **Compact:** overview counts, agent tree, pending permission count.
- **Expanded:** adds current activity, usage, project, and evidence badges.
- **Panels:** Timeline and Inspector open via `session.panel`, with fullscreen
  fallback on narrow terminals.
- **Scrollable** content; keyboard navigation via `context.keymap.layer`.

## Status indicators

| Indicator | Meaning |
|---|---|
| `●` | running / observed busy |
| `◷` | derived waiting (pending permission or form) — label as derived |
| `✓` | completed, from observed outcome |
| `✕` | failed, from observed failure event/outcome |
| `?` | unknown / unavailable |

## Required states

- **Loading:** initial data sync in progress; show a muted label.
- **Empty:** no sessions/events; show "No agents observed".
- **Unavailable:** field missing from SDK; show `Unavailable`, never `0`.
- **Disconnected/stale:** no activity past threshold; show "Stale / Disconnected".
- **Unsupported:** capability absent; show the fallback explanation.
- **Error:** plugin failure must not crash the host TUI; show a short error line.

## Narrow terminals

The native sidebar can be hidden (`session.sidebar: "hide"`) or absent when
space is tight. Fallbacks, in order:

1. `session.panel` opened by a palette command.
2. Plugin route/page.
3. `home.footer.status` minimal status line.

## Phase 1 implementation

The actual sidebar now renders:

```text
AGENT MONITOR
[Loading session data… | Error: … | No agents observed]
OVERVIEW
  ● Running n · ◷ Waiting n (derived) · ✓ Completed n · ✕ Failed n
AGENT TREE
  ▾ orchestrator                     ●
    backend-agent                    ●
      Tool: edit (observed)
      File: src/api.ts (inferred)
    test-agent ◷ permission          ? STALE
CURRENT ACTIVITY
  Agent: backend-agent
  Tool: edit (observed)
  File: src/api.ts (inferred)
  Duration: 00:02:41 | Unavailable
USAGE
  Input: 12.4k · Output: 3.2k
  Total: 15.6k · Cost: reported 0.0421 | Unavailable
```

`home.footer.status` keeps `MONITOR <running>● <pending>◷`. `Ctrl+G` toggles
the monitor panel or the plugin-route fallback; `Esc` or `q` closes the panel
while focused, and `Esc` also closes the route while it is active. The palette
command `Agent Monitor: close` handles both. Each observed agent gets a palette
command that navigates to its native session.

Derived/inferred labels are explicit: pending permissions → `derived waiting`,
`filesystem.changed` files → `unattributed`, missing usage/cost → `Unavailable`.

## Phase 2 implementation

The monitor panel gains:

```text
PERMISSIONS
  ◷ edit src/api.ts · backend-agent · tool call-1 · 10:00:01
  [Enter] Open native prompt   (no custom approval buttons)

TIMELINE  (filters: agent=all, kind=all, severity=all)
  10:00:00 ● Session created · orchestrator
  10:00:05 ● Agent delegated · backend-agent
  10:00:10 ◷ Permission requested · backend-agent
  10:00:12 ✕ Tool failed · backend-agent
  10:00:15 ✓ Permission resolved · backend-agent
```

Filter commands use native dialogs; active filters are shown inline and can be
cleared. `Esc`/`q` still close the panel. Permission rows open the native
the host TUI prompt via session navigation — they never approve or reject directly.

## Phase 3 implementation

- `USAGE` expands to input / output / reasoning / cache read / cache write /
  total, session duration, and per-agent usage.
- Cost is either `reported <value>` or `Estimated <value> (source … version …
  date …)`. Estimates are opt-in via `showEstimate`.
- `PROJECT` shows branch and changed-file counts (added / modified / deleted)
  from observed `vcs.status`, plus observed test/build results with evidence
  badges.
- Compact mode hides CURRENT ACTIVITY and USAGE; toggled by a palette command.

## Phase 4 implementation

A HARNESS section in the monitor panel lists checks with evidence glyphs:
`✓ Verified`, `● Observed`, `◷ Declared`, `? Missing`, `✕ Failed`. A summary
line counts each level. Agent text alone never produces `Verified`.

## UI refinement (uncommitted work)

- A central `src/ui/theme.ts` maps the host TUI semantic theme tokens to one
  `Styles` object; components no longer use a single hard-coded foreground.
- Shared primitives: `Section`, `StatusBadge`, `KeyValue`, `MiniBar`,
  `FilterChip`, `EmptyState`, `UnavailableState`, built from OpenTUI `box` and
  `text` elements.
- Phase B adds an application shell in `src/ui/shell/`: `AppHeader`, `TabBar`
  with an active-tab highlight, `StatusLine`, and responsive `AppShell` that
  switches to two columns at width >= 72 or uses one column when narrow.
- The monitor panel uses the shell, keeps keyboard tab switching (`1`–`4`),
  and hides inactive filter chips so no empty outlines appear above content.
- `PanelInput.width` and `context.renderer` resize events drive responsive
  layout for panel and route views.
- All colors come from `context.theme` feedback/action/border tokens, so
  light/dark themes work automatically.

## Phase C — Overview redesign

Overview is now an Agent Command Center with a strict priority order:

1. Four `MetricCard` counters: running, waiting (derived), completed, failed.
2. `AgentTree` with clear indentation, status-colored glyphs, permission and
   stale badges, plus tool/file detail lines when available.
3. `CURRENT ACTIVITY` with agent, tool, and inferred file.
4. Pending permissions in the secondary column.
5. Recent activity as compact `EventRow`s.
6. Usage summary with input/output/total and reported cost.

At width >= 72 the shell places primary content (counters, tree, activity) in
the left column and secondary content (permissions, recent activity, usage) in
the right column. Narrow terminals stack all sections vertically. Empty states
use `EmptyState` instead of large empty bordered panels.

## Phase D — Timeline redesign

The Timeline tab is now an event-oriented interface:

- Each `EventRow` shows timestamp (wide layout), severity glyph, raw event
  type, title, and agent name.
- A second line shows an observed detail string (tool name/command/file,
  permission action/resources, error message, changed file, usage counts) and
  a duration when it can be derived from paired events.
- Durations come only from paired observable events (tool call → outcome,
  execution start → terminal event); otherwise they are omitted, not guessed.
- Filter chips are shown only on the Timeline tab and reflect the active
  agent/kind/severity filters.
- Up to 60 chronological events are rendered in the scrollbox; empty state uses
  a dedicated hint instead of a blank bordered panel.

## Phase E — Harness redesign

The Harness tab now presents evidence rather than a flat list:

- A `VERIFICATION SUMMARY` section shows counts for all five evidence levels,
  a progress bar for verified + observed checks, and the independently
  evidenced percentage.
- Checks are grouped into `VERIFIED`, `OBSERVED`, `DECLARED`, `MISSING`, and
  `FAILED` sections. Empty groups are not rendered.
- Each `EvidenceRow` shows the glyph, evidence level, check title, explanation,
  and optional resource path.
- A persistent note states that agent self-reports are `Declared`, never
  `Verified`.

## Phase F — Usage redesign

The Usage tab is now a data-oriented analytics view:

- Token metric cards for input, output, cached (read + write), reasoning, and
  total tokens.
- `UsageBreakdown` renders native text bars per token category.
- `USAGE BY AGENT` and `USAGE BY MODEL` aggregate only observed token data;
  nodes without tokens or model information are skipped rather than guessed.
- Cost separates reported cost from opt-in estimated cost. When estimates are
  enabled, source/version/date provenance is shown; when unavailable, an
  explicit `Unavailable` state is rendered.
- PROJECT context remains at the bottom for changed files and observed
  test/build results.

## Phase G — Responsive behavior

Layout modes are derived from actual width (`src/ui/layout.ts`):

- **Narrow** (<64): single column, no tab shortcut labels, no timeline
  timestamps/agent column, metric cards stacked one per row.
- **Medium** (64–99): two compact columns with metric cards in two rows.
- **Wide** (>=100): two full columns with metric cards in one row.

`AppShell` uses `PanelInput.width` for panels and `context.renderer.terminalWidth`
for the plugin route, with a resize listener cleaned up on unload.

## Subagent visibility

The AGENTS section lists agent definitions from the current project's
`.opencode/agents/`. Colors distinguish state and role:

- `●` success — definition has a running session
- `○` muted — definition exists but has no running session
- `PRIMARY` in action color, `SUBAGENT` in info color
- `retry` note in warning color

The live-session tree is no longer rendered. The monitor shows only agent
definitions from the current project, with distinct colors:

- `●` success — running
- `✓` info — completed
- `✕` error — failed
- `○` muted — idle
- `○` faint — unknown

Execution terminal events clear running overrides so completed agents never keep
a green running dot. The status line includes a separate `Running N` count.
