# Fake architecture

This project is intentionally tiny. It exists so that:

- file changes are easy to observe in Git status,
- test commands produce a deterministic pass/fail mix,
- agents have plausible work to delegate.

No architecture claims here are evidence for the Harness Inspector; that
module uses `AGENTS.md`, `PROJECT_SPEC.md`, and the acceptance criteria in
`PROJECT_SPEC.md`.

## Current architecture note

The current code is a small in-memory TypeScript (ESM) fixture: `src/api.ts`
holds a `Map` of users, `src/database.ts` holds a `Map` of rows, and
`src/services.ts` composes them (`onboard` adds a user and writes/reads a row).
`src/generated.ts` exists only as a file-change fixture. Tests in `tests/`
use Vitest: `npm test` runs both suites with one intentionally failing case
(duplicate onboarding in `services.test.ts`), while `npm run test:pass` runs
the passing API suite only. Static scenario inputs live under `fixtures/` and
live agent definitions under `.opencode/agents/`; fixture simulation is kept
separate from real host adapters.

## API work and test results note

The delegated API work touches `src/api.ts`: the in-memory user `Map` is
exposed through `getUser`, `addUser`, `userCount`, and `removeUser`, and the
file carries a delegation metadata constant (`PARENT_SESSION_ID`) identifying
the orchestrator session that assigned the work. These are fixture-only API
helpers for observable file changes and status signals, not production code.
Per the test lab, `npm test` is expected to report 3 pass / 1 fail (the
intentionally failing duplicate-onboarding case in `services.test.ts`), while
`npm run test:pass` runs the passing API suite only (2 pass). No test command
was executed by this docs agent; these results are the documented expectations
from `TEST_LAB.md`, not a fresh observation.

Child-session delegation record: parent (orchestrator) session ID:
`ses_df249badbffeJ91RcZ1qaFNQzT` (captured from `OPENCODE_SESSION_ID` by this
docs agent). The older placeholder `ses_current_orchestrator` still appears in
`src/api.ts`; that source file is outside this docs agent's scope.

## Documentation-state note (docs-agent)

Verified during this docs pass: installed host is `opencode v2.4.1`
(`opencode --version`), matching the `@opencode/plugin@2.4.1` and
`@opencode/client@2.4.1` versions recorded in the parent project's
`COMPATIBILITY_REPORT.md`. This fixture repo has no `@opencode/*` packages
installed and no SDK imports, so no event names, slots, or commands are claimed
here. `docs/COMPATIBILITY_REPORT.md` does not exist in this fixture repo (only
`docs/architecture.md` is present); compatibility reporting for the fixture is
Unavailable and should be handled by the orchestrator in the parent project.
No test command was run by this docs agent; test results above remain
documented expectations from `TEST_LAB.md`, not a fresh observation.

## Live delegation scenario

In the live hierarchy scenario, `orchestrator` delegates API work to
`backend-agent` (`src/api.ts`), tests to `test-agent` (`npm test`), and docs to
`docs-agent` (this file). This exists only to make delegation observable in the
monitor; it is not an architecture claim or Harness Inspector evidence.

## Child-session documentation pass note

This child docs-agent was spawned by orchestrator session
`ses_current_orchestrator` (parent session ID supplied in the task); no
permission request was approved and no file was deleted during this pass. The
working tree remains intentionally dirty (modified `src/api.ts`, added
`src/generated.ts`, deleted `docs/old-notes.md`), and source files were not
touched by this agent. The delegation metadata constant in `src/api.ts` is
currently `ses_df249bae1ffeFRwcNFH38qIo1Z`; this differs from the session IDs
recorded above, and the discrepancy is left unresolved rather than guessed.
Installed host is `opencode v2.4.1`; SDK compatibility reporting for this
fixture remains Unavailable (no `@opencode/*` packages or SDK imports here).

## Follow-up docs pass (child docs-agent)

This child docs-agent inspected this file before editing and added only this
short note; no source files were changed. Recorded child session ID (from
`OPENCODE_SESSION_ID`): `ses_df235e828ffeWrZE8iaoDQY45P`. Parent (orchestrator)
session ID supplied explicitly in this task: Unavailable — the task states the
parent context is available but does not include the ID, so it is not guessed
here; the IDs recorded above are left as prior observations. Verified in this
pass: `opencode --version` reports `opencode v2.4.1`, and `git status --short`
shows the intentionally dirty fixture tree (modified `src/api.ts`, added
`src/generated.ts`, deleted `docs/old-notes.md`, plus other untracked/modified
fixture files). No permission request was approved, no file was deleted, and no
test command was run by this docs agent; test results above remain documented
expectations from `TEST_LAB.md`, not a fresh observation. SDK compatibility
reporting for this fixture remains Unavailable (no `@opencode/*` packages or
SDK imports present).

## Parent-ID correction note (child docs-agent)

This child docs-agent inspected this file and the surrounding source/tests
before editing and changed only this file. Parent (orchestrator) session ID for
this pass: `ses_df22da18effeF4XT8f3AkEIxSm` (read from `OPENCODE_SESSION_ID` in
this child's environment). Note that earlier sections record several different
parent IDs and `src/api.ts` currently carries
`PARENT_SESSION_ID = "ses_df2363823ffeEqt89m2FynExh7"`; those are prior
observations from other child passes and are not reconciled here rather than
guessing which is authoritative. Verified this pass: `opencode --version`
reports `opencode v2.4.1`; source is still the in-memory `Map` fixture
(`src/api.ts`, `src/database.ts`, `src/services.ts`) with `tests/api.test.ts`
(2 tests) and `tests/services.test.ts` (1 intentionally failing duplicate
onboarding case); `npm test` and `npm run test:pass` expectations remain as
documented in `TEST_LAB.md`. No test command was run by this docs agent. No
permission request was approved, no file was deleted, and no source file was
modified by this agent.
