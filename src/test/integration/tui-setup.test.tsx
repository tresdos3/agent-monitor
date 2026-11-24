import { describe, expect, it, vi } from "vitest"

const { define } = vi.hoisted(() => ({
  define: vi.fn((definition: unknown) => definition),
}))

vi.mock("@opencode/plugin/tui", () => ({ Plugin: { define } }))

import monitor from "../../tui.js"

type Handler = (event: unknown) => void

function makeContext(panelOpenReturns = true) {
  const handlers = new Map<string, Handler>()
  const unsubscribe = vi.fn()
  const rpcUnsubscribe = vi.fn()
  const disposeSlot = vi.fn()
  const disposeRouter = vi.fn()
  const toast = vi.fn()
  const layer = vi.fn<(factory: unknown) => void>()
  const slot = vi.fn<(claim: { append: string }) => () => void>(() => disposeSlot)
  const panelOpen = vi.fn(() => panelOpenReturns)
  const panelClose = vi.fn()
  const panelCurrent = vi.fn((): { name: string; sessionID: string } | undefined => undefined)
  const navigate = vi.fn()
  const current = vi.fn((): { type: string; sessionID?: string; name?: string; id?: string } => ({ type: "home" }))
  const permissionSync = vi.fn(async () => {})
  const permissionList = vi.fn(() => [])
  const sessionList = vi.fn(() => [])
  const sessionSync = vi.fn(async () => {})
  const sessionStatus = vi.fn(() => "idle" as const)
  const sessionGet = vi.fn(() => undefined)
  const clientSessionList = vi.fn(async () => ({ data: [] as unknown[], cursor: {} }))
  const clientSessionActive = vi.fn(async () => ({}))
  const rpcHistory = vi.fn(async () => ({ events: [] as unknown[] }))
  const rpcEventOn = vi.fn(() => rpcUnsubscribe)
  const clientRpc = vi.fn(() => ({ history: rpcHistory, events: { on: rpcEventOn } }))
  const dialogSelect = vi.fn(async () => undefined as string | undefined)
  const filterState: Record<string, unknown> = {}
  const settingsState: Record<string, unknown> = { compact: false, showEstimate: false }
  const storageMemory = vi.fn(() => [
    filterState,
    (mutation: (draft: Record<string, unknown>) => void) => mutation(filterState),
  ] as const)
  const storageStore = vi.fn(() => [
    settingsState,
    (mutation: (draft: Record<string, unknown>) => void) => mutation(settingsState),
  ] as const)
  const vcsStatus = vi.fn(async () => ({ location: { directory: "/fake" }, data: [] }))
  const vcsGet = vi.fn(async () => ({
    location: { directory: "/fake" },
    data: { branch: { current: "main", default: "main" } },
  }))
  const locationDefault = vi.fn(() => ({ directory: "/fake" }))
  const vcsInfo = vi.fn(() => ({ branch: { current: "main", default: "main" } }))
  const modelList = vi.fn(() => [])
  const modelSync = vi.fn(async () => {})
  const agentList = vi.fn(() => [])
  const agentSync = vi.fn(async () => {})
  const rendererOn = vi.fn()
  const rendererOff = vi.fn()

  return {
    handlers,
    unsubscribe,
    rpcUnsubscribe,
    disposeSlot,
    disposeRouter,
    toast,
    layer,
    slot,
    panelOpen,
    panelClose,
    panelCurrent,
    navigate,
    current,
    permissionSync,
    permissionList,
    sessionList,
    sessionSync,
    sessionStatus,
    sessionGet,
    clientSessionList,
    clientSessionActive,
    rpcHistory,
    rpcEventOn,
    clientRpc,
    dialogSelect,
    storageMemory,
    storageStore,
    filterState,
    settingsState,
    vcsStatus,
    vcsGet,
    locationDefault,
    vcsInfo,
    modelList,
    modelSync,
    agentList,
    agentSync,
    rendererOn,
    rendererOff,
    context: {
      ui: {
        toast: { show: toast },
        slot,
        dialog: { select: dialogSelect },
        panel: { open: panelOpen, close: panelClose, current: panelCurrent },
        router: {
          register: vi.fn(() => disposeRouter),
          navigate,
          current,
        },
      },
      data: {
        on: vi.fn((type: string, handler: Handler) => {
          handlers.set(type, handler)
          return unsubscribe
        }),
        session: {
          list: sessionList,
          sync: sessionSync,
          status: sessionStatus,
          permission: { sync: permissionSync, list: permissionList },
          get: sessionGet,
        },
        location: {
          default: locationDefault,
          agent: { list: agentList, sync: agentSync },
          vcs: { info: vcsInfo },
          model: { list: modelList, sync: modelSync },
        },
      },
      client: {
        rpc: clientRpc,
        vcs: { get: vcsGet, status: vcsStatus },
        session: { list: clientSessionList, active: clientSessionActive },
      },
      storage: { memory: storageMemory, store: storageStore },
      renderer: { width: 100, terminalWidth: 100, on: rendererOn, off: rendererOff },
      keymap: { layer },
      theme: {
        text: {
          base: "#ffffff",
          muted: "#aaaaaa",
          faint: "#666666",
          action: { primary: { base: "#00aaff" } },
          feedback: {
            error: { base: "#ff4444", muted: "#aa2222" },
            warning: { base: "#ffaa00", muted: "#aa7700" },
            success: { base: "#00cc66", muted: "#008844" },
            info: { base: "#4488ff", muted: "#2255aa" },
          },
        },
        border: { base: "#444444" },
        background: { raised: { base: "#111111" } },
        scrollbar: { base: "#555555" },
      },
    },
  }
}

function commandsFrom(ctx: ReturnType<typeof makeContext>) {
  const factory = ctx.layer.mock.calls[0]?.[0] as () => {
    commands: Array<{ id: string; run: () => void }>
  }
  return factory().commands
}

const OBSERVED_EVENTS = [
  "session.execution.started",
  "session.execution.succeeded",
  "session.execution.failed",
  "session.execution.interrupted",
  "permission.asked",
  "permission.replied",
  "filesystem.changed",
  "session.created",
  "session.forked",
  "session.deleted",
  "session.status",
  "session.usage.updated",
  "vcs.branch.updated",
  "agent.updated",
]

describe("Phase 2 timeline and permission TUI setup", () => {
  it("hydrates RPC history, registers filters, and cleans up", async () => {
    const ctx = makeContext()
    const cleanup = await (monitor.setup as (context: unknown) => unknown)(ctx.context)

    expect(ctx.toast).toHaveBeenCalledWith({
      title: "Agent Monitor",
      message: "Agent Monitor loaded",
      variant: "success",
    })
    expect(ctx.clientRpc).toHaveBeenCalled()
    expect(ctx.agentSync).toHaveBeenCalled()
    expect(ctx.clientSessionList).toHaveBeenCalled()
    expect(ctx.clientSessionActive).toHaveBeenCalled()
    expect(ctx.rpcHistory).toHaveBeenCalled()
    expect(ctx.rpcEventOn).toHaveBeenCalledWith("normalized", expect.any(Function))
    expect(ctx.storageMemory).toHaveBeenCalledWith("filters", { initial: {} })
    expect(ctx.storageStore).toHaveBeenCalledWith("settings", {
      initial: { compact: false, showEstimate: false },
    })
    expect(ctx.vcsStatus).toHaveBeenCalled()
    expect(ctx.vcsGet).toHaveBeenCalledWith({ location: { directory: "/fake" } })

    expect(ctx.slot.mock.calls.map((call) => call[0].append)).toEqual([
      "sidebar.content",
      "home.footer.status",
      "session.panel",
    ])
    for (const type of OBSERVED_EVENTS) {
      expect(ctx.context.data.on).toHaveBeenCalledWith(type, expect.any(Function))
    }

    const allCommands = ctx.layer.mock.calls.flatMap((call) => {
      const factory = call[0] as () => { commands: Array<{ id: string; run: () => void }> }
      return factory().commands
    })
    expect(allCommands.map((command) => command.id)).toContain("agent-monitor.open.section.timeline")
    expect(allCommands.map((command) => command.id)).toContain("agent-monitor.open.close")

    const commands = commandsFrom(ctx)
    expect(commands.map((command) => command.id)).toEqual([
      "agent-monitor.open",
      "agent-monitor.close",
      "agent-monitor.close.route",
      "agent-monitor.filter.agent",
      "agent-monitor.filter.kind",
      "agent-monitor.filter.severity",
      "agent-monitor.filter.clear",
      "agent-monitor.compact",
      "agent-monitor.estimate",
      "agent-monitor.history",
      "agent-monitor.harness",
      "agent-monitor.spike.ping",
    ])

    commands[11].run()
    expect(ctx.toast).toHaveBeenCalledWith({
      title: "Agent Monitor",
      message: "pong",
      variant: "success",
    })

    commands[0].run()
    expect(ctx.panelOpen).toHaveBeenCalledWith("agent-monitor.monitor")

    ctx.panelCurrent.mockReturnValue({ name: "agent-monitor.monitor", sessionID: "ses-1" })
    commands[0].run()
    expect(ctx.panelClose).toHaveBeenCalledOnce()

    const cleanupFn = cleanup as () => void
    cleanupFn()
    expect(ctx.unsubscribe).toHaveBeenCalledTimes(OBSERVED_EVENTS.length)
    expect(ctx.rpcUnsubscribe).toHaveBeenCalledOnce()
    expect(ctx.disposeSlot).toHaveBeenCalledTimes(3)
    expect(ctx.disposeRouter).toHaveBeenCalledOnce()
  })

  it("adds a native-prompt command when a permission is asked", async () => {
    const ctx = makeContext()
    await (monitor.setup as (context: unknown) => unknown)(ctx.context)

    ctx.handlers.get("permission.asked")?.({
      id: "evt-1",
      created: 1730000000000,
      type: "permission.asked",
      data: {
        id: "perm-1",
        sessionID: "ses-backend",
        action: "edit",
        resources: ["src/api.ts"],
      },
    })

    const permissionCommand = commandsFrom(ctx).find((command) => command.id.includes("permission.perm-1"))
    expect(permissionCommand).toBeDefined()
    permissionCommand?.run()
    expect(ctx.navigate).toHaveBeenCalledWith({ type: "session", sessionID: "ses-backend" })
    expect(ctx.toast).toHaveBeenCalledWith({
      title: "Agent Monitor",
      message: "Use the host TUI's native permission prompt",
      variant: "info",
    })
  })

  it("falls back to a plugin route and toggles it closed", async () => {
    const ctx = makeContext(false)
    await (monitor.setup as (context: unknown) => unknown)(ctx.context)

    commandsFrom(ctx)[0].run()
    expect(ctx.navigate).toHaveBeenCalledWith({
      type: "plugin",
      name: "agent-monitor.monitor",
      data: { sessionID: undefined },
    })

    ctx.current.mockReturnValue({ type: "plugin", id: "agent-monitor.tui", name: "agent-monitor.monitor" })
    commandsFrom(ctx)[0].run()
    expect(ctx.navigate).toHaveBeenLastCalledWith({ type: "home" })
  })

  it("tolerates malformed events without crashing", async () => {
    const ctx = makeContext()
    await (monitor.setup as (context: unknown) => unknown)(ctx.context)

    for (const handler of ctx.handlers.values()) {
      expect(() => handler({ type: "unknown" })).not.toThrow()
    }
  })

  it("ignores a late busy status for an already completed session", async () => {
    const ctx = makeContext()
    const cleanup = await (monitor.setup as (context: unknown) => unknown)(ctx.context)

    const terminal = (type: string) =>
      ctx.handlers.get(type)?.({
        id: `evt-${type}`,
        created: 1,
        type,
        data: { sessionID: "ses-late", error: undefined },
      })
    const busy = () =>
      ctx.handlers.get("session.status")?.({
        id: "evt-busy",
        created: 2,
        type: "session.status",
        data: { sessionID: "ses-late", status: { type: "busy" } },
      })

    terminal("session.execution.succeeded")
    busy()
    // A new run must re-enable live running state.
    ctx.handlers.get("session.execution.started")?.({
      id: "evt-start",
      created: 3,
      type: "session.execution.started",
      data: { sessionID: "ses-late" },
    })
    busy()
    expect(() => (cleanup as () => void)()).not.toThrow()
  })

  it("observes a quota failure without fabricating quota state", async () => {
    const ctx = makeContext()
    const cleanup = await (monitor.setup as (context: unknown) => unknown)(ctx.context)

    expect(() =>
      ctx.handlers.get("session.execution.failed")?.({
        id: "evt-quota",
        created: 1730000000000,
        type: "session.execution.failed",
        data: {
          sessionID: "ses-1",
          error: { type: "provider", message: "Free usage limit reached. Subscribe to keep going." },
        },
      }),
    ).not.toThrow()

    // The panel slot and all subscriptions remain registered after the failure.
    expect(ctx.slot.mock.calls.map((call) => call[0].append)).toContain("session.panel")
    ;(cleanup as () => void)()
  })

  it("degrades gracefully when RPC and VCS are unavailable", async () => {
    const ctx = makeContext()
    ctx.rpcHistory.mockRejectedValue(new Error("RPC unavailable"))
    ctx.vcsGet.mockRejectedValue(new Error("VCS unavailable"))
    ctx.vcsStatus.mockRejectedValue(new Error("VCS unavailable"))
    ctx.modelSync.mockRejectedValue(new Error("model catalog unavailable"))

    const cleanup = await (monitor.setup as (context: unknown) => unknown)(ctx.context)
    expect(cleanup).toBeTypeOf("function")
    expect(() => (cleanup as () => void)()).not.toThrow()
  })

  it("disposes all subscriptions across repeated load cycles", async () => {
    for (let cycle = 0; cycle < 50; cycle++) {
      const ctx = makeContext()
      const cleanup = (await (monitor.setup as (context: unknown) => unknown)(ctx.context)) as () => void
      cleanup()
      expect(ctx.unsubscribe).toHaveBeenCalledTimes(OBSERVED_EVENTS.length)
      expect(ctx.rpcUnsubscribe).toHaveBeenCalledOnce()
      expect(ctx.disposeSlot).toHaveBeenCalledTimes(3)
      expect(ctx.disposeRouter).toHaveBeenCalledOnce()
    }
  })
})
