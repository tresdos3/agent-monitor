import type { NormalizedEvent } from "../../domain/model.js"
import type { TestEvidence } from "../../domain/project.js"

const TEST_BUILD_COMMAND =
  /\b(npm|pnpm|yarn|bun)\s+(run\s+)?(test|build|check|typecheck)\b|\b(vitest|jest|tsc|eslint)\b/i

function commandFrom(input: unknown): string | undefined {
  if (typeof input !== "object" || input === null) return undefined
  const command = (input as { command?: unknown }).command ?? (input as { cmd?: unknown }).cmd
  return typeof command === "string" && TEST_BUILD_COMMAND.test(command) ? command : undefined
}

/** Evidence comes from observed tool execution, never from agent descriptions. */
export function testEvidenceFromEvents(events: readonly NormalizedEvent[]): TestEvidence[] {
  const commands = new Map<string, { command: string; sessionID?: string }>()

  for (const event of events) {
    if (event.kind !== "tool.called") continue
    const id = event.data.id
    const command = commandFrom(event.data.input)
    if (typeof id === "string" && command) {
      commands.set(id, { command, sessionID: event.sessionID })
    }
  }

  const evidence: TestEvidence[] = []
  for (const event of events) {
    if (event.kind !== "tool.success" && event.kind !== "tool.failed") continue
    const id = event.data.id
    if (typeof id !== "string") continue
    const call = commands.get(id)
    if (!call) continue
    evidence.push({
      command: call.command,
      sessionID: call.sessionID ?? event.sessionID,
      status: event.kind === "tool.success" ? "passed" : "failed",
      evidence: "observed",
      timestamp: event.created,
    })
  }

  return evidence
}
