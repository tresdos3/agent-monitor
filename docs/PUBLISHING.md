# Publishing Agent Monitor to npm

This is the release runbook for publishing the plugin and cutting the matching
GitHub release. **Publishing requires explicit owner approval** — do not run the
final `npm publish` until that approval is given.

> **Important — name collision (checked 2026-11-24):** `opencode-agent-monitor`
> is already taken on npm (v1.2.1, maintained by a different account). You must
> choose a free name before publishing. Available alternatives confirmed with
> `npm view`: `tresdos-agent-monitor`, `opencode-agent-monitor-tresdos`,
> `@tresdos/agent-monitor`. If you use a scoped name, add
> `--access public` to `npm publish`.

---

## 0. What ships

The package is **TypeScript source only** — there is no build step. The host
loads the entry points directly:

| Export | File | Role |
|---|---|---|
| `.` | `src/index.ts` | Server part: bounded, location-scoped event history + RPC |
| `./tui` | `src/tui.tsx` | TUI part: signals, slots, keymaps, panels |
| `./rpc` | `src/rpc.ts` | Typed server↔TUI contract |

`package.json` `files` includes `src` (excluding `src/test`), `docs`,
`CHANGELOG.md`, `LICENSE`, and `README.md`. Verify with:

```sh
npm pack --dry-run
```

Expected (as of v1.0.0): ~67 files, ~58 kB packed, ~214 kB unpacked. Confirm:

- `src/index.ts`, `src/tui.tsx`, `src/rpc.ts` are present
- `src/test/**` is **absent**
- no `scripts/`, `.env`, credentials, or absolute paths
- `README.md`, `CHANGELOG.md`, `LICENSE`, `docs/` are present

---

## 1. Install from GitHub (recommended — no registry publish required)

The host can install a plugin directly from a Git repository. This bypasses the
npm name collision and works today:

```sh
opencode plugin add github:tresdos3/agent-monitor#main
```

The CLI clones the repo, installs it into the host plugin cache, and adds the
specifier to the global config. Manage it with:

```sh
opencode plugin list
opencode plugin update github:tresdos3/agent-monitor#main
opencode plugin remove github:tresdos3/agent-monitor#main
```

| Specifier | Behavior |
|---|---|
| `#main` | Tracks the branch; auto-updates on startup / every 24 h |
| `#v1.0.0` | Pinned to a tag; stays put |
| `#<full-sha>` | Pinned to an exact commit; fully reproducible |

**Keep `main` current.** Before documenting or testing a `#main` install,
fast-forward `main` to the release branch:

```sh
git checkout main
git merge --ff-only dev
git push origin main
git checkout dev
```

Otherwise `#main` installs an older build. Verify the install in a clean
project: expect the `Agent Monitor loaded` toast, `Ctrl+G` panel, and
`History ready`. Check the host log for load errors.

The plugin ships as TypeScript source with no build step, so a Git install
loads the same `src/index.ts`, `src/tui.tsx`, and `src/rpc.ts` as a registry
install. Peer dependencies (`@opentui/core`, `@opentui/solid`, `solid-js`) are
resolved by the host; `solid-js` is pinned to `^1.9.0` to stay compatible with
`@opentui/solid@0.9.9`.

---

## 2. One-time npm setup (only for a registry release)

```sh
npm whoami          # currently: tresdos
npm login           # only if the above fails
```

Check the exact name you intend to publish:

```sh
npm view <package-name> version
# E404 / "Not found" means the name is available
```

If the name is taken, change `name` in `package.json` and update every reference:

```sh
grep -R "opencode-agent-monitor" --exclude-dir=node_modules --exclude-dir=.git .
```

Places that reference the package name: `package.json`, `README.md`, this doc,
`docs/INSTALLATION.md`, and `agent-monitor-fixtures/.opencode/opencode.json`
(only if you switch the fixture to the published package).

---

## 3. Pre-release checks

All checks must pass from the repository root:

```sh
pnpm verify:compat   # installed host must match @opencode/plugin 2.4.1
pnpm typecheck
pnpm test            # 101 tests / 17 files at last check
pnpm test:lab        # 27 checks, 0 failures expected
pnpm pack --dry-run  # inspect the tarball contents
pnpm peers check     # no unmet peer dependencies
```

The root package uses **pnpm** (`packageManager: pnpm@12.4.2`,
`pnpm-lock.yaml`); the fixture project intentionally stays on npm.
`prepublishOnly` runs `verify:compat`, `typecheck`, and `test` on publish;
`test:lab` is separate because it drives a live tmux TUI.

### Release metadata checklist

- [ ] `version` in `package.json` is correct
- [ ] `CHANGELOG.md` has an entry with the new version and date
- [ ] `README.md` status line and requirements are current
- [ ] `PROJECT_STATUS.md` reflects the shipped state
- [ ] `LICENSE` is MIT and included in the tarball
- [ ] `engines.node` is `>=26.4.0`
- [ ] Dependencies are pinned: `@opencode/plugin@2.4.1`, `@opencode/client@2.4.1`
- [ ] Git identity is correct (see §6)

---

## 4. Bump the version

Use **`npm version`** for bumping (in pnpm 12, `pnpm version` applies change
intents instead). It creates a commit and a tag:

```sh
npm version patch     # 1.0.0 -> 1.0.1
# or: npm version minor
# or: npm version major
```

Update `CHANGELOG.md` **before** running `npm version` so the tagged commit
contains the final notes. If you forget, amend the version commit:

```sh
git commit --amend --no-edit
git tag -f v<version>
```

Push the commit and tag only after the release is approved:

```sh
git push origin dev
git push origin v<version>
```

---

## 5. Publish

```sh
npm publish --access public
```

For a scoped name (`@tresdos/agent-monitor`), `--access public` is required for
the first publish. For an unscoped name it is harmless.

If you need to verify without publishing:

```sh
npm publish --dry-run
```

### Undoing a mistake

Prefer deprecation over removal — unpublished versions cannot be reused:

```sh
npm deprecate <package-name>@<version> "reason"
```

`npm unpublish` is a last resort and is restricted by npm policy.

---

## 6. Verify the published package

From a **fresh directory** (not this repo):

```sh
npm view <package-name> version
npm install <package-name>
opencode --version                    # must be 2.4.1
```

Add to a project's `opencode.jsonc`:

```jsonc
{
  "$schema": "https://opencode.ai/config.json",
  "plugins": ["<published-package-name>"]
}
```

Confirm in the TUI:

- `Agent Monitor loaded` toast appears.
- `Ctrl+G` opens the panel; tabs `1`–`4`, `Tab`, and `Shift+Tab` work.
- Status line shows `History ready` (loaded via `opencode.json(c)`).
- No plugin errors in the host TUI log (under the host's data/log directory).

`cli.json` loads only the TUI part; `History live-only` is expected there and is
not a defect.

### Optional: switch the fixture to the published package

After a successful publish, change
`agent-monitor-fixtures/.opencode/opencode.json`:

```jsonc
"plugins": ["<published-package-name>"]
```

Then re-run `npm run test:lab` and update `TEST_LAB.md` /
`docs/INSTALLATION.md` to document both local and published loading.

---

## 7. Git identity and GitHub release

Verify the identity that will appear on the release commits and tag:

```sh
git config --get user.name    # Luis Juarez
git config --get user.email   # tresdosasd@gmail.com
```

All existing commits were rewritten on 2026-11-24 to use this identity. If a
commit still shows `example <example@mail.com>`, fix it before tagging.

Push the release:

```sh
git push origin dev
git push origin v<version>
```

On GitHub:

1. Set `main` as the default branch.
2. Add a description and topics: `opencode`, `tui`, `typescript`, `observability`.
3. Confirm the MIT `LICENSE` is visible.
4. Create a Release from the `v<version>` tag and paste the changelog entry.
5. Attach nothing else — the npm tarball is the distributable.

---

## 8. Post-release

- [ ] Clean install in a fresh project succeeds.
- [ ] `History ready` confirmed with the published package.
- [ ] Host logs show no plugin load errors.
- [ ] `PROJECT_STATUS.md` updated with the published version.
- [ ] GitHub Release published and linked from the README.

---

## Quick reference

```sh
# install from GitHub (no publish needed)
opencode plugin add github:tresdos3/agent-monitor#main

# preflight (pnpm)
pnpm verify:compat && pnpm typecheck && pnpm test && pnpm test:lab
pnpm pack --dry-run

# optional registry release (after owner approval)
npm version patch
npm publish --access public
git push origin dev && git push origin v<version>

# keep #main current before a GitHub install
git checkout main && git merge --ff-only dev && git push origin main
```
