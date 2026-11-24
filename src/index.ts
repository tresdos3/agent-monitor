import { Plugin } from "@opencode/plugin"
import { normalizeEvent } from "./application/normalize.js"
import { appendUnique } from "./application/timeline.js"
import type { NormalizedEvent } from "./domain/model.js"
import { AgentMonitor } from "./rpc.js"

const SERVER_LIMIT = 500

const SERVER_EVENT_TYPES = [
  "session.created",
  "session.forked",
  "session.agent.selected",
  "session.execution.started",
  "session.execution.succeeded",
  "session.execution.failed",
  "session.execution.interrupted",
  "session.status",
  "session.deleted",
  "session.tool.input.started",
  "session.tool.called",
  "session.tool.success",
  "session.tool.failed",
  "permission.asked",
  "permission.replied",
  "session.usage.updated",
  "filesystem.changed",
  "vcs.branch.updated",
] as const

function eventLocation(event: unknown): string | undefined {
  if (typeof event !== "object" || event === null || !("location" in event)) return undefined
  const location = (event as { location?: { directory?: unknown } }).location
  return typeof location?.directory === "string" ? location.directory : undefined
}

/** Server part: bounded, location-scoped normalized history exposed over RPC. */
export default Plugin.define({
  id: "agent-monitor",
  async setup(ctx) {
    const controller = new AbortController()
    let history: readonly NormalizedEvent[] = []

    const registration = await ctx.rpc.register(AgentMonitor, {
      history: async () => ({ events: history }),
    })

    void (async () => {
      try {
        for await (const event of ctx.event.subscribe({
          types: [...SERVER_EVENT_TYPES],
          signal: controller.signal,
        })) {
          const location = eventLocation(event)
          if (location && location !== ctx.location.directory) continue

          const normalized = normalizeEvent(event)
          if (!normalized) continue

          const next = appendUnique({ events: history, limit: SERVER_LIMIT }, normalized, SERVER_LIMIT)
          history = next.events
          await registration.events.emit("normalized", { event: normalized }).catch(() => {})
        }
      } catch (cause) {
        if (!controller.signal.aborted) {
          console.error("agent-monitor: event stream error", cause)
        }
      }
    })()

    return async () => {
      controller.abort()
      await registration.dispose()
    }
  },
})
