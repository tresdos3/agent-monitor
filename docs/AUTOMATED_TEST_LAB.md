# Automated LAB Verification

Two levels of automation are provided. Neither replaces the visual checks in
`agent-monitor-fixtures/TEST_LAB.md`.

## 1. Full hybrid verifier (recommended)

```sh
npm run test:lab
```

Runs:

- toolchain checks (Node >= 26, host v2.4.1)
- fixture config and five-agent-definition checks
- fixture baseline (`npm test` → 3 pass / 1 fail, `npm run test:pass` → 2 pass)
- fixture Git state checks
- API assertions via `opencode api get /api/session?directory=<fixture>`
- a best-effort tmux TUI harness: `Ctrl+G`, tabs `1`–`4`, text capture, `Esc`

The TUI portion uses text capture only. It cannot verify colors, spacing, or
layout. Failures in the TUI portion are warnings; static/API failures are hard
failures.

## 2. Interactive TUI driver

```sh
npm run test:lab:tui
```

Creates a tmux session, captures text from each tab, and pauses before teardown.
Useful when you want the pane snapshots in one place. It does not approve any
permission prompts.

## Manual steps that remain

1. Run TEST_LAB scenario 1 and watch state transitions visually.
2. Run scenario 2 and decide the permission prompt yourself.
3. Confirm green `●` appears only while an agent is running.
4. If the known stale-state bug reproduces, log it in
   `docs/BUG-agent-state-stale.md`.

## Safety

- No `--auto` flag is used.
- No credentials or API keys are read or stored.
- Tmux sessions are killed on exit.
- APIs are queried against the local host service only.
