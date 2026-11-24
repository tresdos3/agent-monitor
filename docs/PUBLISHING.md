# Publishing Agent Monitor

The package is published as TypeScript source; there is no build step. the host TUI
loads `src/index.ts`, `src/tui.tsx`, and `src/rpc.ts` directly.

## 1. One-time npm setup

```sh
npm whoami                 # must be logged in
npm login                  # if not logged in
```

Check name availability:

```sh
npm view opencode-agent-monitor version
```

If the name is taken, change `name` in `package.json` and update all docs.

## 2. Pre-release checks

From the repository root:

```sh
npm run verify:compat      # host version must match @opencode/plugin
npm run typecheck
npm test
npm pack --dry-run
```

Confirm the tarball includes:

- `src/` (with `exports` entry points)
- `docs/`
- `README.md`, `CHANGELOG.md`, `LICENSE`
- no `src/test/**`
- no absolute paths, `.env`, or credentials

Current package metadata:

```json
{
  "name": "opencode-agent-monitor",
  "version": "1.0.0",
  "license": "MIT",
  "exports": {
    ".": "./src/index.ts",
    "./tui": "./src/tui.tsx",
    "./rpc": "./src/rpc.ts"
  }
}
```

## 3. Bump the version

Use npm versioning (creates a Git commit and tag):

```sh
npm version patch           # 1.0.0 -> 1.0.1
# or: npm version minor     # 1.0.0 -> 1.1.0
# or: npm version major     # 1.0.0 -> 2.0.0
```

Update `CHANGELOG.md` with the new version and date before committing/tagging,
or amend the npm-version commit if needed.

## 4. Publish to npm

```sh
npm publish --access public
```

Then verify:

```sh
npm view opencode-agent-monitor version
npm install -g opencode-agent-monitor
```

## 5. Load the published plugin

In any project's `opencode.json(c)`:

```jsonc
{
  "$schema": "https://opencode.ai/config.json",
  "plugins": ["opencode-agent-monitor"]
}
```

the host TUI loads both parts: the server part from `.` and the TUI part from
`./tui`. Do not use `cli.json` if you want RPC history; `cli.json` starts only
the TUI part and the status line shows `History live-only`.

## 6. Optional: switch the fixture to the published package

After publishing, change
`agent-monitor-fixtures/.opencode/opencode.json`:

```json
"plugins": ["opencode-agent-monitor"]
```

Update `TEST_LAB.md` and `INSTALLATION.md` to mention both local and published
loading.

## 7. Push the public GitHub repository

```sh
git remote add origin git@github.com:<your-user>/<your-repo>.git
git push -u origin main
git push origin dev
```

Then on GitHub:

1. Set `main` as the default branch.
2. Add a description, topics (`opencode`, `tui`, `typescript`, `observability`).
3. Confirm the MIT `LICENSE` is visible.
4. Create a Release from the `npm version` tag and paste the changelog entry.

## 8. After publishing

- Test a clean install in a fresh directory.
- Confirm `History ready` with the published package.
- Watch the host TUI logs for plugin load errors.
- If you must remove a version, prefer `npm deprecate` over `npm unpublish`.

## Git identity used for releases

```sh
git config --global user.name   # e.g. "Example Contributor"
git config --global user.email  # e.g. "contributor@example.com"
```
