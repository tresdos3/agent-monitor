import type { AgentInfo } from "@opencode/client"
import { describe, expect, it } from "vitest"
import { agentInfoToDefinition, filterVisibleDefinitions } from "../../adapters/agents/definitions.js"

function info(id: string, mode: "subagent" | "primary" | "all" = "subagent", hidden = false): AgentInfo {
  return {
    id,
    name: id,
    mode,
    hidden,
    permissions: [],
    request: {},
  } as unknown as AgentInfo
}

describe("agentInfoToDefinition", () => {
  it("maps a project agent definition", () => {
    expect(agentInfoToDefinition(info("backend-agent", "subagent"), {
      sessionID: "ses-1",
      status: "running",
      note: "retry",
    })).toEqual({
      id: "backend-agent",
      name: "backend-agent",
      description: undefined,
      mode: "subagent",
      hidden: false,
      color: undefined,
      source: "project",
      runningSessionID: "ses-1",
      status: "running",
      statusNote: "retry",
    })
  })

  it("detects built-in agents", () => {
    expect(agentInfoToDefinition(info("build", "primary")).source).toBe("builtin")
  })

  it("does not invent a running session", () => {
    const definition = agentInfoToDefinition(info("docs-agent"))
    expect(definition.status).toBe("unknown")
    expect(definition.runningSessionID).toBeUndefined()
  })

  it("does not mark completed sessions as running", () => {
    const definition = agentInfoToDefinition(info("docs-agent"), {
      sessionID: "ses-1",
      status: "completed",
      note: "completed",
    })
    expect(definition.status).toBe("completed")
    expect(definition.runningSessionID).toBeUndefined()
  })
})

describe("filterVisibleDefinitions", () => {
  const definitions = [
    agentInfoToDefinition(info("orchestrator", "primary")),
    agentInfoToDefinition(info("backend-agent")),
    agentInfoToDefinition(info("build", "primary")),
    agentInfoToDefinition(info("secret-agent", "subagent", true)),
  ]

  it("hides built-in and hidden agents by default", () => {
    expect(filterVisibleDefinitions(definitions).map((entry) => entry.id)).toEqual([
      "orchestrator",
      "backend-agent",
    ])
  })

  it("can include all definitions when requested", () => {
    expect(filterVisibleDefinitions(definitions, { includeBuiltin: true, includeHidden: true })).toHaveLength(4)
  })
})
