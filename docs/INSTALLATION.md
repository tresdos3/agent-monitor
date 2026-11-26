# Installation

## Compatibility

Designed and typechecked against the host TUI **v2.4.1**, `@opencode/plugin@2.4.1`,
`@opencode/client@2.4.1`. Development requires **Node >=26.4.0** (verified with
v26.13.1) to satisfy the declared OpenTUI engine range. No external backend or
network access is needed at runtime.

Verify the local toolchain before packaging (the root package uses **pnpm**,
the fixture project intentionally uses npm):

```sh
pnpm verify:compat
pnpm typecheck
pnpm test
pnpm pack --dry-run
```

`verify:compat` fails if the installed `opencode --version` does not match the
pinned `@opencode/plugin` dependency.

## Install the published plugin

### From GitHub (recommended — no registry publish required)

```sh
opencode plugin add github:tresdos3/agent-monitor#main
```

This clones the repo, installs it into the host plugin cache, and adds the
specifier to your global config. `#main` follows branch updates; pin with
`#<sha>` or `#v<version>` for reproducibility. Manage with `opencode plugin
list | update | remove`.

### From npm (once published)

```sh
opencode plugin add <PACKAGE-NAME>
```

Or add either specifier manually to a project's `opencode.jsonc` or your
user-level `opencode.jsonc`:

```jsonc
{
  "plugins": ["github:tresdos3/agent-monitor#main"]
}
```

Loading through `opencode.json(c)` starts both server and TUI parts, enabling
RPC history (`History ready`). `cli.json` loads only the TUI part
(`History live-only`).

## Development / spike testing (non-destructive)

From this repository:

```sh
pnpm install
pnpm typecheck
pnpm test
```

Load the plugin into a real TUI without editing your global `cli.json`:

```sh
cd agent-monitor-fixtures
opencode
```

The fixture project config uses the relative plugin path `../../`, so the
plugin loads from the sibling package without modifying your global config.

Expected: an `Agent Monitor loaded` toast, the `AGENT MONITOR` sidebar with
Overview sections, and a `MONITOR 0● 0◷` footer canary. `Ctrl+G` opens the
monitor panel; keys `1`–`4` switch tabs.

If the sidebar is not visible, check your user-level `cli.json`
(typically `<config-dir>/opencode/cli.json`):

```jsonc
{
  "session": { "sidebar": "auto" }
}
```

`"hide"` intentionally hides the sidebar; use a plugin panel/route once those
exist in Phase 1+.

## Global installation (target)

Once published or linked, add the package to your user-level `cli.json`
(typically `<config-dir>/opencode/cli.json`):

```jsonc
{
  "plugins": ["github:tresdos3/agent-monitor#main"]
}
```

Because the package exports a server part as well, it can also be loaded
globally from your user-level `opencode.json(c)` (typically under `<config-dir>/opencode/`):

```jsonc
{
  "$schema": "https://opencode.ai/config.json",
  "plugins": ["github:tresdos3/agent-monitor#main"]
}
```

## Project-local installation (target)

In a project's `opencode.jsonc`:

```jsonc
{
  "$schema": "https://opencode.ai/config.json",
  "plugins": ["github:tresdos3/agent-monitor#main"]
}
```

Or as a local directory:

```jsonc
{
  "plugins": ["../agent-monitor"]
}
```

Local auto-discovery also works with:

```text
<project>/.opencode/plugins/agent-monitor/index.ts
<project>/.opencode/plugins/agent-monitor/tui.ts
```

Note: a TUI-only plugin cannot be configured per project through `cli.json`;
there is no project-local `cli.json`. The dual server+TUI export is required
for project-local loading.

## Unload / disable

Remove the plugin entry or prefix it with `-` in the `plugins` array. All
subscriptions and slot claims are removed on unload by the cleanup function.

## Troubleshooting

- Raw REST calls to the local service return `401`; use `opencode api` or the
  generated client, which handles discovery and auth.
- Check the host TUI log in its data/log directory (filter `role=cli` and
  `role=server`). Redact secrets before sharing.
- the host TUI watches config files and reloads plugins; use `/reload` to force a
  full reload. Do not restart the host TUI just to apply config changes.
