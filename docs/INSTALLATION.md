# Installation

## Compatibility

Designed and typechecked against the host TUI **v2.4.1**, `@opencode/plugin@2.4.1`,
`@opencode/client@2.4.1`. Development requires **Node >=26.4.0** (verified with
v26.13.1) to satisfy the declared OpenTUI engine range. No external backend or
network access is needed at runtime.

Verify the local toolchain before packaging:

```sh
npm run verify:compat
npm run typecheck
npm test
npm pack --dry-run
```

`verify:compat` fails if the installed `opencode --version` does not match the
pinned `@opencode/plugin` dependency.

## Development / spike testing (non-destructive)

From this repository:

```sh
npm install
npm run typecheck
npm test
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

If the sidebar is not visible, check `~/.config/opencode/cli.json`:

```jsonc
{
  "session": { "sidebar": "auto" }
}
```

`"hide"` intentionally hides the sidebar; use a plugin panel/route once those
exist in Phase 1+.

## Global installation (target)

Once published or linked, add the package to `~/.config/opencode/cli.json`:

```jsonc
{
  "plugins": ["opencode-agent-monitor"]
}
```

Because the package exports a server part as well, it can also be loaded
globally from `~/.config/opencode/opencode.json(c)`:

```jsonc
{
  "$schema": "https://opencode.ai/config.json",
  "plugins": ["opencode-agent-monitor"]
}
```

## Project-local installation (target)

In a project's `opencode.jsonc`:

```jsonc
{
  "$schema": "https://opencode.ai/config.json",
  "plugins": ["opencode-agent-monitor"]
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
- Check logs at `~/.local/share/opencode/log/opencode.log` (filter `role=cli`
  and `role=server`). Redact secrets before sharing.
- the host TUI watches config files and reloads plugins; use `/reload` to force a
  full reload. Do not restart the host TUI just to apply config changes.
