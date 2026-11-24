import { Rpc } from "@opencode/plugin/rpc"

/**
 * Typed contract for server-side normalized history and live pushes.
 * The TUI also receives the same events through `context.data.on`; IDs are
 * deduplicated in the application layer.
 */
export const AgentMonitor = Rpc.define({
  id: "agent-monitor",
  methods: {
    history: {
      input: {
        type: "object",
        properties: {},
        additionalProperties: false,
      },
      output: {
        type: "object",
        properties: {
          events: {
            type: "array",
            items: { type: "object" },
          },
        },
        required: ["events"],
        additionalProperties: false,
      },
    },
  },
  events: {
    normalized: {
      schema: {
        type: "object",
        properties: {
          event: { type: "object" },
        },
        required: ["event"],
        additionalProperties: false,
      },
    },
  },
})
