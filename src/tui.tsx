import { createMemo, createSignal } from "solid-js"
import { Plugin } from "@opencode/plugin/tui"
import type { PanelInput } from "@opencode/plugin/tui/context"
import {
  permissionFromEvent,
  permissionRequestToView,
  type PermissionView,
} from "./adapters/permissions/permission.js"
import { agentInfoToDefinition, filterVisibleDefinitions, type AgentLink } from "./adapters/agents/definitions.js"
import { projectFromVcs } from "./adapters/git/vcs.js"
import { inspectHarness } from "./adapters/harness/inspector.js"
import { testEvidenceFromEvents } from "./adapters/project/test-evidence.js"
import { sessionBelongsToLocation, sessionToLike } from "./adapters/sessions/session.js"
import { estimateCost, type ModelLike } from "./adapters/usage/pricing.js"
import { usageFromTokens } from "./adapters/usage/usage.js"
import { normalizeEvent, normalizeEvents } from "./application/normalize.js"
import { buildAgentTree, mapSessionStatus, type SessionLike } from "./application/reducer.js"
import {
  EVENT_KINDS,
  SEVERITIES,
  appendUnique,
  filterEvents,
  mergeHistories,
} from "./application/timeline.js"
import type { AgentDefinition } from "./domain/agents.js"
import type { HarnessReport } from "./domain/harness.js"
import { EMPTY_TIMELINE, type EventKind, type Severity, type TokenUsage } from "./domain/model.js"
import type {
  MonitorSettings,
  PricingEstimate,
  ProjectView,
  UsageSnapshot,
} from "./domain/project.js"
import { AgentMonitor } from "./rpc.js"
import { sessionCommands, type PaletteCommand } from "./ui/navigation/commands.js"
import { SECTIONS, TimelinePanel, type MonitorSection } from "./ui/panels/TimelinePanel.js"
import { Sidebar } from "./ui/sidebar/Sidebar.js"
import { createStyles } from "./ui/theme.js"

const MONITOR_PANEL = "agent-monitor.monitor"

interface FilterState {
  sessionID?: string
  kind?: EventKind
  severity?: Severity
}

interface SettingsState {
  compact: boolean
  showEstimate: boolean
}

/** Phase 2: bounded timeline, filters, and display-only permission center. */
export default Plugin.define({
  id: "agent-monitor.tui",
  setup(context) {
    context.ui.toast.show({
      title: "Agent Monitor",
      message: "Agent Monitor loaded",
      variant: "success",
    })

    const styles = createStyles(context.theme)
    const [sessions, setSessions] = createSignal<readonly SessionLike[]>([])
    const [timeline, setTimeline] = createSignal(EMPTY_TIMELINE)
    const [running, setRunning] = createSignal(0)
    const [pendingPermissions, setPendingPermissions] = createSignal(0)
    const [pendingBySession, setPendingBySession] = createSignal<ReadonlyMap<string, number>>(new Map())
    const [permissionViews, setPermissionViews] = createSignal<readonly PermissionView[]>([])
    const [lastFile, setLastFile] = createSignal<string | undefined>()
    const [loading, setLoading] = createSignal(true)
    const [error, setError] = createSignal<string | undefined>()
    const [historyStatus, setHistoryStatus] = createSignal<"loading" | "ready" | "unavailable">("loading")
    const [filters, setFilters] = context.storage.memory<FilterState>("filters", { initial: {} })
    const [settings, updateSettings] = context.storage.store<SettingsState>("settings", {
      initial: { compact: false, showEstimate: false },
    })
    const [usage, setUsage] = createSignal<UsageSnapshot | undefined>()
    const [project, setProject] = createSignal<ProjectView>({ changedFiles: [] })
    const [harness, setHarness] = createSignal<HarnessReport | undefined>()
    const [agentDefinitions, setAgentDefinitions] = createSignal<readonly AgentDefinition[]>([])
    const [section, setSection] = createSignal<MonitorSection>("overview")
    const [statusOverrides, setStatusOverrides] = createSignal<ReadonlyMap<string, "running" | "idle">>(new Map())
    const [statusNotes, setStatusNotes] = createSignal<ReadonlyMap<string, string>>(new Map())
    const [activeSessions, setActiveSessions] = createSignal<ReadonlySet<string>>(new Set())
    const readWidth = () => context.renderer.terminalWidth || context.renderer.width || 80
    const [terminalWidth, setTerminalWidth] = createSignal(readWidth())
    const onResize = () => setTerminalWidth(readWidth())
    context.renderer.on("resize", onResize)

    const nodes = createMemo(() =>
      buildAgentTree(sessions(), {
        statusOverrides: statusOverrides(),
        statusNotes: statusNotes(),
        activeSessions: activeSessions(),
      }),
    )
    const definitions = createMemo(() => {
      const links = new Map<string, AgentLink>()
      for (const node of nodes()) {
        if (!node.agent) continue
        const link: AgentLink = {
          sessionID: node.id,
          status: node.status === "waiting" ? "unknown" : node.status,
          note: node.statusNote,
        }
        const existing = links.get(node.agent)
        if (!existing || (link.status === "running" && existing.status !== "running")) links.set(node.agent, link)
      }
      return filterVisibleDefinitions(agentDefinitions()).map((definition) => {
        const link = links.get(definition.id)
        return link
          ? {
              ...definition,
              runningSessionID: link.status === "running" ? link.sessionID : undefined,
              status: link.status,
              statusNote: link.note,
            }
          : definition
      })
    })
    const filteredTimeline = createMemo(() => ({
      ...EMPTY_TIMELINE,
      events: filterEvents(timeline(), filters),
    }))
    const evidence = createMemo(() => testEvidenceFromEvents(timeline().events))
    const estimate = createMemo<PricingEstimate | undefined>(() => {
      if (!settings.showEstimate) return undefined
      const snapshot = usage()
      if (!snapshot) return undefined
      const models = (context.data.location.model.list() ?? []) as unknown as readonly ModelLike[]
      return estimateCost(snapshot, models)
    })

    function agentFor(sessionID: string): string | undefined {
      return nodes().find((node) => node.id === sessionID)?.agent
    }

    function tokensFor(sessionID: string): TokenUsage | undefined {
      const tokens = context.data.session.get(sessionID)?.tokens
      if (!tokens) return undefined
      return {
        input: tokens.input,
        output: tokens.output,
        reasoning: tokens.reasoning,
        cacheRead: tokens.cache.read,
        cacheWrite: tokens.cache.write,
      }
    }

    function costFor(sessionID: string): number | undefined {
      return context.data.session.get(sessionID)?.cost
    }

    const refreshSessions = async (): Promise<void> => {
      setLoading(true)
      try {
        const location = context.location ?? context.data.location.default()
        const directory = location?.directory
        const current = context.data.session.list().filter((session) => sessionBelongsToLocation(session, directory))
        await Promise.all(
          current.map(async (session) => {
            try {
              await context.data.session.sync(session.id)
            } catch {
              context.data.session.invalidate(session.id)
            }
          }),
        )
        const merged = new Map(
          current.map((session) => [session.id, sessionToLike(session, context.data.session.status(session.id))]),
        )
        try {
          const response = await context.client.session.list({ directory, limit: 100 })
          for (const session of response.data ?? []) {
            if (!sessionBelongsToLocation(session, directory)) continue
            if (!merged.has(session.id)) {
              merged.set(session.id, sessionToLike(session, context.data.session.status(session.id)))
            }
          }
        } catch {
          // Client cache remains the source of truth when the server list is unavailable.
        }
        setSessions([...merged.values()])
        setActiveSessions((previous) => new Set([...previous].filter((id) => merged.has(id))))
        setError(undefined)
      } catch (cause) {
        setError(cause instanceof Error ? cause.message : "Session data unavailable")
      } finally {
        setLoading(false)
      }
    }

    const refreshAgentDefinitions = async (): Promise<void> => {
      try {
        const location = context.location ?? context.data.location.default()
        await context.data.location.agent.sync(location)
        const infos = context.data.location.agent.list(location) ?? []
        setAgentDefinitions(infos.map((info) => agentInfoToDefinition(info)))
      } catch {
        setAgentDefinitions([])
      }
    }

    const refreshTimers = new Set<ReturnType<typeof setTimeout>>()
    const scheduleRefresh = (): void => {
      const timer = setTimeout(() => {
        refreshTimers.delete(timer)
        void refreshSessions()
      }, 150)
      refreshTimers.add(timer)
    }

    const refreshActive = async (): Promise<void> => {
      try {
        const active = await context.client.session.active()
        const known = new Set(sessions().map((session) => session.id))
        const next = new Set<string>()
        for (const [sessionID, value] of Object.entries(active)) {
          if (value.type === "running" && known.has(sessionID)) next.add(sessionID)
        }
        setActiveSessions(next)
      } catch {
        // Active state is an enhancement; live events still drive the UI.
      }
    }

    const refreshPermissions = async (): Promise<void> => {
      const current = context.ui.router.current()
      if (current.type !== "session") return
      const sessionID = current.sessionID
      try {
        await context.data.session.permission.sync(sessionID)
        const requests = context.data.session.permission.list(sessionID) ?? []
        setPendingBySession((previous) => {
          const next = new Map(previous)
          next.set(sessionID, requests.length)
          return next
        })
        setPermissionViews((previous) => {
          const byID = new Map(previous.map((view) => [view.id, view]))
          for (const request of requests) {
            const id = String(request.id)
            byID.set(
              id,
              permissionRequestToView(request, {
                agent: agentFor(String(request.sessionID)),
                requestedAt: byID.get(id)?.requestedAt,
                status: "pending",
              }),
            )
          }
          return [...byID.values()].slice(-50)
        })
      } catch {
        // Missing permission data is not an error state for the whole monitor.
      }
    }

    const refreshUsage = (): void => {
      const current = context.ui.router.current()
      if (current.type !== "session") return
      const session = context.data.session.get(current.sessionID)
      const model = session?.model ? `${session.model.providerID}/${session.model.id}` : undefined
      setUsage(
        usageFromTokens({
          sessionID: current.sessionID,
          tokens: tokensFor(current.sessionID),
          cost: session?.cost,
          model,
          timestamp: session?.time.updated,
        }),
      )
    }

    const refreshProject = async (): Promise<void> => {
      try {
        const location = context.location ?? context.data.location.default()
        void context.data.location.model.sync(location).catch(() => {})
        const info = context.data.location.vcs.info(location)
        const status = await context.client.vcs.status()
        setProject(projectFromVcs(info, status, Date.now()))
      } catch {
        setProject({ changedFiles: [] })
      }
    }

    let harnessRefreshing = false
    const refreshHarness = async (): Promise<void> => {
      if (harnessRefreshing) return
      harnessRefreshing = true
      try {
        const location = context.location ?? context.data.location.default()
        setHarness(
          await inspectHarness({
            directory: location?.directory,
            project: project(),
            evidence: evidence(),
          }),
        )
      } catch {
        setHarness(undefined)
      } finally {
        harnessRefreshing = false
      }
    }

    void refreshSessions()
    void refreshAgentDefinitions()
    void refreshActive()
    const activeTimer = setInterval(() => {
      if (isMonitorOpen()) void refreshActive()
    }, 5_000)
    void refreshPermissions()
    refreshUsage()
    void refreshProject()
    void refreshHarness()

    const rpcStops: Array<() => void> = []
    const hydrateHistory = async (): Promise<void> => {
      setHistoryStatus("loading")
      try {
        const rpc = context.client.rpc(AgentMonitor)
        const result = (await rpc.history({})) as { events?: unknown[] }
        const normalized = normalizeEvents(result.events ?? [])
        setTimeline((state) => mergeHistories(state.events, normalized, 200))
        setHistoryStatus("ready")
        rpcStops.push(
          rpc.events.on("normalized", (payload) => {
            try {
              const event = normalizeEvent((payload as { event?: unknown }).event)
              if (!event) return
              setTimeline((state) => appendUnique(state, event, 200))
            } catch {
              // One bad push must not break the stream.
            }
          }),
        )
      } catch {
        setHistoryStatus("unavailable")
      }
    }
    void hydrateHistory()

    const changePending = (sessionID: string | undefined, delta: number): void => {
      setPendingPermissions((count) => Math.max(0, count + delta))
      if (!sessionID) return
      setPendingBySession((previous) => {
        const next = new Map(previous)
        next.set(sessionID, Math.max(0, (next.get(sessionID) ?? 0) + delta))
        return next
      })
    }

    const stops: Array<() => void> = []

    stops.push(
      context.data.on("session.execution.started", (event) => {
        const normalized = normalizeEvent(event)
        if (!normalized) return
        setTimeline((state) => appendUnique(state, normalized, 200))
        setRunning((count) => count + 1)
      }),
    )

    const terminalNotes: Readonly<Record<string, string>> = {
      "session.execution.succeeded": "completed",
      "session.execution.failed": "failed",
      "session.execution.interrupted": "interrupted",
    }
    for (const type of ["session.execution.succeeded", "session.execution.failed", "session.execution.interrupted"] as const) {
      stops.push(
        context.data.on(type, (event) => {
          setRunning((count) => Math.max(0, count - 1))
          const sessionID = event.data?.sessionID
          if (typeof sessionID !== "string") return
          setStatusOverrides((previous) => {
            const next = new Map(previous)
            next.delete(sessionID)
            return next
          })
          setStatusNotes((previous) => new Map(previous).set(sessionID, terminalNotes[type] ?? "finished"))
        }),
      )
    }

    stops.push(
      context.data.on("permission.asked", (event) => {
        changePending(event.data?.sessionID, 1)
        const sessionID = event.data?.sessionID
        const normalized = normalizeEvent(event)
        const view = normalized
          ? permissionFromEvent(normalized, {
              agent: typeof sessionID === "string" ? agentFor(sessionID) : undefined,
            })
          : undefined
        if (view) {
          setPermissionViews((previous) => [...previous.filter((item) => item.id !== view.id), view].slice(-50))
        }
        void refreshPermissions()
      }),
    )
    stops.push(
      context.data.on("permission.replied", (event) => {
        changePending(event.data?.sessionID, -1)
        const requestID = event.data?.requestID
        if (typeof requestID === "string") {
          setPermissionViews((previous) =>
            previous.map((view) => (view.id === requestID ? { ...view, status: "resolved" } : view)),
          )
        }
        void refreshPermissions()
      }),
    )
    stops.push(
      context.data.on("filesystem.changed", (event) => {
        const file = event.data?.file
        if (typeof file === "string") setLastFile(file)
        void refreshHarness()
      }),
    )
    stops.push(context.data.on("session.usage.updated", refreshUsage))
    stops.push(
      context.data.on("vcs.branch.updated", () => {
        void refreshProject().then(refreshHarness)
      }),
    )
    stops.push(context.data.on("agent.updated", () => void refreshAgentDefinitions()))

    for (const type of ["session.created", "session.forked", "session.deleted"] as const) {
      stops.push(
        context.data.on(type, (event) => {
          const normalized = normalizeEvent(event)
          if (normalized) setTimeline((state) => appendUnique(state, normalized, 200))
          scheduleRefresh()
        }),
      )
    }

    stops.push(
      context.data.on("session.status", (event) => {
        const data = event.data as { sessionID?: unknown; status?: { type?: unknown } }
        const sessionID = typeof data?.sessionID === "string" ? data.sessionID : undefined
        const rawStatus = typeof data?.status?.type === "string" ? data.status.type : undefined
        if (sessionID && rawStatus) {
          const mapped = mapSessionStatus(rawStatus)
          setStatusOverrides((previous) => new Map(previous).set(sessionID, mapped.status))
          setStatusNotes((previous) => {
            const next = new Map(previous)
            if (mapped.note) next.set(sessionID, mapped.note)
            else next.delete(sessionID)
            return next
          })
        }
        const normalized = normalizeEvent(event)
        if (normalized) setTimeline((state) => appendUnique(state, normalized, 200))
        scheduleRefresh()
      }),
    )

    function isMonitorRoute(): boolean {
      const current = context.ui.router.current()
      return current.type === "plugin" && current.name === MONITOR_PANEL
    }

    function isMonitorOpen(): boolean {
      return context.ui.panel.current()?.name === MONITOR_PANEL || isMonitorRoute()
    }

    function toggleMonitor(): void {
      if (context.ui.panel.current()?.name === MONITOR_PANEL) {
        context.ui.panel.close()
        return
      }
      if (isMonitorRoute()) {
        context.ui.router.navigate({ type: "home" })
        return
      }
      const current = context.ui.router.current()
      const sessionID = current.type === "session" ? current.sessionID : undefined
      const opened = context.ui.panel.open(MONITOR_PANEL)
      if (!opened) {
        context.ui.router.navigate({ type: "plugin", name: MONITOR_PANEL, data: { sessionID } })
      }
    }

    function closeMonitor(): void {
      if (context.ui.panel.current()?.name === MONITOR_PANEL) {
        context.ui.panel.close()
      } else if (isMonitorRoute()) {
        context.ui.router.navigate({ type: "home" })
      }
    }

    const navigateToSession = (sessionID: string): void => {
      context.ui.router.navigate({ type: "session", sessionID })
    }

    function permissionCommands(): readonly PaletteCommand[] {
      return permissionViews()
        .filter((view) => view.status === "pending")
        .slice(0, 8)
        .map((view) => ({
          id: `agent-monitor.permission.${view.id}`,
          title: `Agent Monitor: open permission ${view.action}`,
          palette: true,
          run: () => {
            navigateToSession(view.sessionID)
            context.ui.toast.show({
              title: "Agent Monitor",
              message: "Use the host TUI's native permission prompt",
              variant: "info",
            })
          },
        }))
    }

    async function chooseAgentFilter(): Promise<void> {
      const choice = await context.ui.dialog.select({
        title: "Filter timeline by agent",
        options: [
          { title: "All", value: "" },
          ...nodes().map((node) => ({ title: node.label, value: node.id })),
        ],
      })
      if (choice === undefined) return
      setFilters((draft) => {
        draft.sessionID = choice || undefined
      })
    }

    async function chooseKindFilter(): Promise<void> {
      const choice = await context.ui.dialog.select({
        title: "Filter timeline by event type",
        options: [
          { title: "All", value: "" },
          ...EVENT_KINDS.map((kind) => ({ title: kind, value: kind })),
        ],
      })
      if (choice === undefined) return
      setFilters((draft) => {
        draft.kind = (choice || undefined) as EventKind | undefined
      })
    }

    async function chooseSeverityFilter(): Promise<void> {
      const choice = await context.ui.dialog.select({
        title: "Filter timeline by severity",
        options: [
          { title: "All", value: "" },
          ...SEVERITIES.map((severity) => ({ title: severity, value: severity })),
        ],
      })
      if (choice === undefined) return
      setFilters((draft) => {
        draft.severity = (choice || undefined) as Severity | undefined
      })
    }

    function clearFilters(): void {
      setFilters((draft) => {
        draft.sessionID = undefined
        draft.kind = undefined
        draft.severity = undefined
      })
    }

    async function openSessionHistory(): Promise<void> {
      const choice = await context.ui.dialog.select({
        title: "Agent Monitor: recent sessions",
        options: context.data.session.list().map((session) => ({
          title: session.title ?? session.id,
          value: session.id,
        })),
      })
      if (typeof choice === "string" && choice.length > 0) navigateToSession(choice)
    }

    const disposeSlot = context.ui.slot({
      append: "sidebar.content",
      render: ({ sessionID }) => (
        <Sidebar
          sessionID={sessionID}
          nodes={nodes}
          definitions={definitions}
          timeline={timeline}
          pendingBySession={pendingBySession}
          loading={loading}
          error={error}
          tokens={() => tokensFor(sessionID)}
          cost={() => costFor(sessionID)}
          styles={styles}
          compact={settings.compact}
        />
      ),
    })

    const disposeFooter = context.ui.slot({
      append: "home.footer.status",
      render: () => (
        <box flexDirection="row" gap={1}>
          <text fg={styles.base}>MONITOR</text>
          <text fg={styles.success}>{running()}●</text>
          <text fg={styles.warning}>{pendingPermissions()}◷</text>
        </box>
      ),
    })

    const disposePanel = context.ui.slot({
      append: "session.panel",
      render: (panel: PanelInput) => (
        <TimelinePanel
          sessionID={panel.sessionID}
          timeline={filteredTimeline}
          allTimeline={timeline}
          nodes={nodes}
          definitions={definitions}
          pendingBySession={pendingBySession}
          filters={() => filters}
          permissions={permissionViews}
          historyStatus={historyStatus}
          nodesCount={() => nodes().length}
          pending={pendingPermissions}
          lastFile={lastFile}
          tokens={() => tokensFor(panel.sessionID)}
          cost={() => costFor(panel.sessionID)}
          usage={usage}
          estimate={estimate}
          project={project}
          evidence={evidence}
          settings={() => settings}
          harness={harness}
          section={section}
          onSection={setSection}
          agentFor={agentFor}
          styles={styles}
          close={panel.close}
          focus={panel.focus}
          width={panel.width}
        />
      ),
    })

    const disposeRoute = context.ui.router.register({
      name: MONITOR_PANEL,
      render: ({ data }) => {
        const sessionID = typeof data?.sessionID === "string" ? data.sessionID : undefined
        return (
          <TimelinePanel
            sessionID={sessionID}
            timeline={filteredTimeline}
            allTimeline={timeline}
            nodes={nodes}
            definitions={definitions}
            pendingBySession={pendingBySession}
            filters={() => filters}
            permissions={permissionViews}
            historyStatus={historyStatus}
            nodesCount={() => nodes().length}
            pending={pendingPermissions}
            lastFile={lastFile}
            tokens={() => (sessionID ? tokensFor(sessionID) : undefined)}
            cost={() => (sessionID ? costFor(sessionID) : undefined)}
            usage={usage}
            estimate={estimate}
            project={project}
            evidence={evidence}
            settings={() => settings}
            harness={harness}
            section={section}
            onSection={setSection}
            agentFor={agentFor}
            styles={styles}
            close={() => context.ui.router.navigate({ type: "home" })}
            width={terminalWidth()}
          />
        )
      },
    })

    context.keymap.layer(() => ({
      mode: "global",
      priority: 10,
      commands: [
        {
          id: "agent-monitor.open",
          title: "Agent Monitor: toggle",
          bind: "ctrl+g",
          palette: true,
          run: toggleMonitor,
        },
        {
          id: "agent-monitor.close",
          title: "Agent Monitor: close",
          palette: true,
          run: closeMonitor,
        },
        {
          id: "agent-monitor.close.route",
          title: "Agent Monitor: close route",
          bind: "escape",
          enabled: isMonitorRoute,
          run: closeMonitor,
        },
        {
          id: "agent-monitor.filter.agent",
          title: "Agent Monitor: filter by agent",
          palette: true,
          run: chooseAgentFilter,
        },
        {
          id: "agent-monitor.filter.kind",
          title: "Agent Monitor: filter by event type",
          palette: true,
          run: chooseKindFilter,
        },
        {
          id: "agent-monitor.filter.severity",
          title: "Agent Monitor: filter by severity",
          palette: true,
          run: chooseSeverityFilter,
        },
        {
          id: "agent-monitor.filter.clear",
          title: "Agent Monitor: clear filters",
          palette: true,
          run: clearFilters,
        },
        {
          id: "agent-monitor.compact",
          title: "Agent Monitor: toggle compact mode",
          palette: true,
          run: () => {
            void updateSettings((draft) => {
              draft.compact = !draft.compact
            })
          },
        },
        {
          id: "agent-monitor.estimate",
          title: "Agent Monitor: toggle cost estimate",
          palette: true,
          run: () => {
            void updateSettings((draft) => {
              draft.showEstimate = !draft.showEstimate
            })
          },
        },
        {
          id: "agent-monitor.history",
          title: "Agent Monitor: session history",
          palette: true,
          run: openSessionHistory,
        },
        {
          id: "agent-monitor.harness",
          title: "Agent Monitor: harness inspector",
          palette: true,
          run: () => {
            if (context.ui.panel.current()?.name !== MONITOR_PANEL && !isMonitorRoute()) toggleMonitor()
          },
        },
        {
          id: "agent-monitor.spike.ping",
          title: "Agent Monitor: ping",
          palette: true,
          run: () =>
            context.ui.toast.show({
              title: "Agent Monitor",
              message: "pong",
              variant: "success",
            }),
        },
        ...sessionCommands(nodes(), navigateToSession),
        ...permissionCommands(),
      ],
      bindings: ["agent-monitor.open", "agent-monitor.close.route"],
    }))

    // Global so the keys work even when the panel root does not own input focus.
    context.keymap.layer(() => ({
      mode: "global",
      priority: 100,
      enabled: isMonitorOpen,
      commands: [
        { id: "agent-monitor.open.close", title: "Agent Monitor: close", bind: "escape", run: closeMonitor },
        { id: "agent-monitor.open.close.q", title: "Agent Monitor: close", bind: "q", run: closeMonitor },
        ...SECTIONS.map((entry, index) => ({
          id: `agent-monitor.open.section.${entry.id}`,
          title: `Agent Monitor: ${entry.label}`,
          bind: String(index + 1),
          run: () => setSection(entry.id),
        })),
      ],
      bindings: [
        "agent-monitor.open.close",
        "agent-monitor.open.close.q",
        ...SECTIONS.map((entry) => `agent-monitor.open.section.${entry.id}`),
      ],
    }))

    return () => {
      clearInterval(activeTimer)
      for (const timer of refreshTimers) clearTimeout(timer)
      refreshTimers.clear()
      for (const stop of stops) stop()
      for (const stop of rpcStops) stop()
      disposeSlot()
      disposeFooter()
      disposePanel()
      disposeRoute()
      context.renderer.off("resize", onResize)
    }
  },
})
