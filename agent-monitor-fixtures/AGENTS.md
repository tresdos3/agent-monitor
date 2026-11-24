# Agent instructions for the fake project

1. Keep changes inside this fake repository.
2. The orchestrator session delegates work to child sessions. Child sessions
   must record their parent session ID.
3. Never approve a permission request on behalf of a human.
4. Report test results only after actually running a test command.
5. When information is unavailable, write `Unavailable` instead of guessing.
6. Human approval checkpoint: a human must approve any permission request or
   file deletion before it happens.
