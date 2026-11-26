# Agent Monitor

[![npm version](https://img.shields.io/npm/v/<PACKAGE-NAME>.svg)](https://www.npmjs.com/package/<PACKAGE-NAME>)
[![npm downloads](https://img.shields.io/npm/dm/<PACKAGE-NAME>.svg?style=flat-square)](https://www.npmjs.com/package/<PACKAGE-NAME>)
[![license](https://img.shields.io/npm/l/<PACKAGE-NAME>.svg?style=flat-square)](LICENSE)
[![tests](https://github.com/tresdos3/agent-monitor/actions/workflows/test.yml/badge.svg)](https://github.com/tresdos3/agent-monitor/actions/workflows/test.yml)
[![Host TUI v2.4.1](https://img.shields.io/badge/host%20TUI-v2.4.1-blue.svg)](docs/COMPATIBILITY_REPORT.md)

**Full Development Observability for the host TUI.** A read-only plugin that
shows agents, tools, permissions, token usage, Git activity, and harness evidence
inside a terminal-native panel. No web dashboard, no Electron app, no external
backend.

> **Status: v1.0.0 — code complete, not yet published to npm.**
> Built and tested against host TUI **v2.4.1**. See
> [PROJECT_STATUS.md](PROJECT_STATUS.md) for verified results and
> [docs/PUBLISHING.md](docs/PUBLISHING.md) for the release checklist.
>
> **Publishing note:** replace `<PACKAGE-NAME>` in the badges and install commands
> with the final npm name. `opencode-agent-monitor` is already taken on npm;
> see [docs/PUBLISHING.md](docs/PUBLISHING.md) for available alternatives.

---

## What it does

| Module | What you get |
|---|---|
| **Overview** | Agent definitions with honest running/completed/failed state, summary counters, current activity, pending permissions, recent events, verification summary, and usage summary |
| **Timeline** | Bounded, deduplicated events with aligned timestamps, severity glyphs, detail text, and agent/kind/severity filters |
| **Harness** | Evidence grouped by level: Verified, Observed, Declared, Missing, Failed, with an independently-evidenced score |
| **Usage** | Token breakdown (input/output/cached/reasoning/total), usage by agent and model, reported cost, opt-in estimates with provenance, and project context |

Agent Monitor is **display-only**: it never approves a permission, never retries
a model call, and never changes an agent's state.

### Non-negotiables

- No fabricated agent status, token counts, or cost.
- `Unavailable` instead of a guessed value.
- Agent self-reports are `Declared`, never `Verified`.
- Permission approval stays with the host TUI's native prompt.
- Subscriptions, RPC listeners, slots, and the server event stream are disposed on unload.

---

## Requirements

| Item | Version |
|---|---|
| Host TUI | v2.4.1 |
| Node | ≥26.4.0 (developed on v26.13.1) |
| `@opencode/plugin` | 2.4.1 |
| `@opencode/client` | 2.4.1 |
| Peer deps | `@opentui/core` ≥0.8.0, `@opentui/solid` ≥0.8.0, `solid-js` ≥1.9.0 |

Run `pnpm verify:compat` to confirm your installed host matches the pinned
SDK.

---

## Install

### From GitHub (recommended — no npm publish needed)

```sh
opencode plugin add github:tresdos3/agent-monitor#main
```

The CLI clones the repo, installs it into the host's plugin cache, and adds the
specifier to your global config. The `#main` branch follows updates
automatically; use `#<commit-sha>` or `#v<version>` to pin an exact build.
Manage it with:

```sh
opencode plugin list
opencode plugin update github:tresdos3/agent-monitor#main
opencode plugin remove github:tresdos3/agent-monitor#main
```

### From npm (once published)

```sh
opencode plugin add <PACKAGE-NAME>
```

> The npm name is not published yet — `opencode-agent-monitor` is already taken.
> See [docs/PUBLISHING.md](docs/PUBLISHING.md) for the naming decision.

You can also add the plugin manually to a project's `opencode.jsonc` (loads
**both** the server part and the TUI part):

```jsonc
{
  "$schema": "https://opencode.ai/config.json",
  "plugins": ["github:tresdos3/agent-monitor#main"]
}
```

Or add it globally in your user-level `opencode.jsonc`
(typically `<config-dir>/opencode/opencode.jsonc`). The host watches config
files and reloads plugins automatically; `/reload` forces a full reload.

### Verify it loaded

Start `opencode`. You should see an **Agent Monitor loaded** toast, an `AGENT
MONITOR` section in the sidebar, and a `MONITOR 0● 0◷` footer canary. Press
`Ctrl+G` to open the panel. The status line shows `History ready` when loaded
through `opencode.json(c)`. Loading only through `cli.json` starts the TUI part
alone and honestly shows `History live-only` — both are expected depending on
how you load the plugin.

### Try it locally without installing

From this repository (development uses **pnpm**):

```sh
pnpm install
pnpm typecheck
pnpm test
cd agent-monitor-fixtures && npm install && opencode
```

The fixture project intentionally stays on npm; the root package uses pnpm.

The fixture config uses the relative path `../../`, so nothing is written to
your global config. See [docs/INSTALLATION.md](docs/INSTALLATION.md) for global,
project-local, and auto-discovery loading options.

---

## Keyboard

| Key | Action |
|---|---|
| `Ctrl+G` | Open / close the monitor panel |
| `1`–`4` | Switch to Overview / Timeline / Harness / Usage |
| `Tab` | Next panel |
| `Shift+Tab` | Previous panel |
| `Esc` / `q` | Close the panel |

The command palette exposes `Agent Monitor: toggle`, `close`, `filter by agent`,
`filter by event type`, `filter by severity`, `clear filters`, `toggle compact
mode`, `toggle cost estimate`, `session history`, `harness inspector`, and
`ping`.

---

## Development

```sh
pnpm typecheck     # tsc --noEmit
pnpm test          # vitest
pnpm verify:compat # host/SDK version gate
pnpm test:lab      # fixtures + API + tmux TUI harness
pnpm pack --dry-run
```

Use `npm version patch|minor|major` for version bumps — `pnpm version` has a
different meaning (applying change intents) in pnpm 12.

The package is published as **TypeScript source** — there is no build step. The
host loads `src/index.ts` (server), `src/tui.tsx` (TUI), and `src/rpc.ts`
(contract) directly. `pnpm pack --dry-run` shows exactly what ships.

### Repository layout

```text
src/
  index.ts          server part: bounded, location-scoped event history
  tui.tsx           TUI part: signals, slots, keymaps, panel/route rendering
  rpc.ts            typed server↔TUI contract
  adapters/         SDK → domain mappings (agents, sessions, VCS, usage, quota…)
  application/      pure normalization, reducer, selectors, timeline
  domain/           SDK-independent models
  ui/               Solid/OpenTUI components, shell, panels
  test/             unit + integration tests
agent-monitor-fixtures/   fake repo with 8 repeatable scenarios
docs/                     architecture, compatibility, testing, release docs
```

**Architecture:** [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) ·
**Host API findings:** [docs/COMPATIBILITY_REPORT.md](docs/COMPATIBILITY_REPORT.md) ·
**Test lab:** [agent-monitor-fixtures/TEST_LAB.md](agent-monitor-fixtures/TEST_LAB.md)

---

## Known limitations

- Sidebar visibility is controlled by the host TUI; a footer canary and a
  `session.panel` / plugin-route fallback keep the monitor reachable.
- Remote servers need the server part installed for RPC history.
- Harness file reads are local to the CLI process.
- Pricing is a dated snapshot; ambiguous tiers render `Unavailable`.
- Free-model quota notices are derived from observed failure text (v2.4.1 has
  no typed quota event); no number or retry is invented.

See [docs/COMPATIBILITY_REPORT.md](docs/COMPATIBILITY_REPORT.md) for the full
list.

---

## License

MIT — see [LICENSE](LICENSE).
