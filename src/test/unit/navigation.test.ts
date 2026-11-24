import { describe, expect, it, vi } from "vitest"
import { sessionCommands } from "../../ui/navigation/commands.js"
import { buildAgentTree } from "../../application/reducer.js"
import type { SessionLike } from "../../application/reducer.js"

const nodes = buildAgentTree([
  { id: "ses-root", agent: "orchestrator", title: "Root", status: "running" },
  { id: "ses-child", parentID: "ses-root", agent: "backend-agent", title: "Child", status: "idle" },
] as SessionLike[])

describe("sessionCommands", () => {
  it("creates one native-navigation command per agent", () => {
    const navigate = vi.fn()
    const commands = sessionCommands(nodes, navigate)

    expect(commands.map((command) => command.id)).toEqual([
      "agent-monitor.session.ses-root",
      "agent-monitor.session.ses-child",
    ])
    expect(commands[0].title).toBe("Agent Monitor: open Root")

    commands[1].run()
    expect(navigate).toHaveBeenCalledWith("ses-child")
  })

  it("limits palette noise", () => {
    const many = Array.from({ length: 20 }, (_, index) => ({
      id: `ses-${index}`,
      agent: "a",
      title: `A${index}`,
      status: "idle" as const,
    }))
    expect(sessionCommands(buildAgentTree(many), vi.fn()).length).toBe(12)
  })
})
