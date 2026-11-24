import { For, onMount, Show } from "solid-js"
import type { PermissionView } from "../../adapters/permissions/permission.js"
import { selectCurrentActivity, type ActivityView } from "../../application/selectors.js"
import { eventDetail, eventDuration } from "../../application/timeline.js"
import type { HarnessReport } from "../../domain/harness.js"
import type { AgentDefinition } from "../../domain/agents.js"
import type { AgentNode, TimelineState, TokenUsage } from "../../domain/model.js"
import type {
  MonitorSettings,
  PricingEstimate,
  ProjectView,
  TestEvidence,
  UsageSnapshot,
} from "../../domain/project.js"
import { AppShell } from "../shell/AppShell.js"
import { AgentDefinitionList } from "../components/AgentDefinitionList.js"
import { EmptyState } from "../components/EmptyState.js"
import { EventRow } from "../components/EventRow.js"
import { FilterChip } from "../components/FilterChip.js"
import { KeyValue } from "../components/KeyValue.js"
import { MetricGrid } from "../components/MetricGrid.js"
import { Section } from "../components/Section.js"
import { compactNumber, historyLabel } from "../components/format.js"
import { truncate, type Styles } from "../theme.js"
import { HarnessPanel } from "./HarnessPanel.js"
import { UsagePanel } from "./UsagePanel.js"

export interface TimelinePanelProps {
  readonly sessionID?: string
  readonly timeline: () => TimelineState
  readonly allTimeline: () => TimelineState
  readonly nodes: () => readonly AgentNode[]
  readonly definitions: () => readonly AgentDefinition[]
  readonly pendingBySession: () => ReadonlyMap<string, number>
  readonly filters: () => { sessionID?: string; kind?: string; severity?: string }
  readonly permissions: () => readonly PermissionView[]
  readonly historyStatus: () => "loading" | "ready" | "unavailable"
  readonly nodesCount: () => number
  readonly pending: () => number
  readonly lastFile: () => string | undefined
  readonly tokens: () => TokenUsage | undefined
  readonly cost: () => number | undefined
  readonly usage: () => UsageSnapshot | undefined
  readonly estimate: () => PricingEstimate | undefined
  readonly project: () => ProjectView
  readonly evidence: () => readonly TestEvidence[]
  readonly settings: () => MonitorSettings
  readonly harness: () => HarnessReport | undefined
  readonly agentFor: (sessionID: string) => string | undefined
  readonly styles: Styles
  readonly section: () => MonitorSection
  readonly onSection: (section: MonitorSection) => void
  readonly close: () => void
  readonly focus?: () => void
  readonly width?: number
}

export type MonitorSection = "overview" | "timeline" | "harness" | "usage"

export const SECTIONS: readonly { id: MonitorSection; label: string }[] = [
  { id: "overview", label: "Overview" },
  { id: "timeline", label: "Timeline" },
  { id: "harness", label: "Harness" },
  { id: "usage", label: "Usage" },
]

export function TimelinePanel(props: TimelinePanelProps) {
  onMount(() => props.focus?.())

  const events = () => props.timeline().events.slice(-60)
  const narrow = () => (props.width ?? 80) < 64
  const historyTone = () => {
    if (props.historyStatus() === "ready") return "success" as const
    if (props.historyStatus() === "unavailable") return "warning" as const
    return "muted" as const
  }
  const counts = () => {
    const definitions = props.definitions()
    const pending = props.pendingBySession()
    return {
      running: definitions.filter((entry) => entry.status === "running").length,
      waiting: definitions.filter(
        (entry) => entry.runningSessionID && (pending.get(entry.runningSessionID) ?? 0) > 0,
      ).length,
      completed: definitions.filter((entry) => entry.status === "completed").length,
      failed: definitions.filter((entry) => entry.status === "failed").length,
    }
  }
  const activity = () => selectCurrentActivity(props.sessionID ?? "", props.allTimeline(), props.nodes())
  const recent = () => props.allTimeline().events.slice(-5).reverse()

  return (
    <AppShell
      title="AGENT MONITOR"
      subtitle="Full development observability"
      live
      tabs={SECTIONS}
      active={props.section()}
      onSelect={(id) => props.onSection(id as MonitorSection)}
      status={[
        { label: "Agents", value: props.definitions().length, tone: "info" },
        { label: "Running", value: props.nodes().filter((node) => node.status === "running").length, tone: "success" },
        { label: "Pending", value: props.pending(), tone: "warning" },
        { label: "History", value: historyLabel(props.historyStatus()), tone: historyTone() },
      ]}
      styles={props.styles}
      width={props.width ?? 80}
      aside={
        props.section() === "overview" ? (
          <box flexDirection="column" gap={1}>
            <Show
              when={props.permissions().length > 0}
              fallback={<EmptyState message="No pending permissions" hint="the host TUI's native prompt stays authoritative" styles={props.styles} />}
            >
              <Section title="PENDING PERMISSIONS" styles={props.styles}>
                <For each={props.permissions().slice(0, 6)}>
                  {(permission) => (
                    <text fg={permission.status === "pending" ? props.styles.warning : props.styles.success}>
                      {permission.status === "pending" ? "◷" : "✓"} {permission.action} on{" "}
                      {permission.resources.join(", ") || "Unavailable"} · {permission.agent ?? "Unavailable"}
                    </text>
                  )}
                </For>
              </Section>
            </Show>

            <Show
              when={recent().length > 0}
              fallback={<EmptyState message="No recent activity" hint="Events will appear as agents work" styles={props.styles} />}
            >
              <Section title="RECENT ACTIVITY" styles={props.styles}>
                <For each={recent()}>
                  {(event) => (
                    <EventRow event={event} agent={event.sessionID ? props.agentFor(event.sessionID) : undefined} styles={props.styles} />
                  )}
                </For>
              </Section>
            </Show>

            <Section title="USAGE SUMMARY" styles={props.styles}>
              <KeyValue label="Input" value={compactNumber(props.usage()?.input)} styles={props.styles} />
              <KeyValue label="Output" value={compactNumber(props.usage()?.output)} styles={props.styles} />
              <KeyValue label="Total" value={compactNumber(props.usage()?.total)} styles={props.styles} />
              <KeyValue
                label="Cost"
                value={props.cost() === undefined ? "Unavailable" : `reported ${props.cost() ?? 0}`}
                styles={props.styles}
              />
            </Section>
          </box>
        ) : undefined
      }
    >
      <Show when={props.section() === "timeline"}>
        <box flexDirection="row" gap={1}>
          <FilterChip label={`agent: ${props.filters().sessionID ?? "all"}`} active={!!props.filters().sessionID} styles={props.styles} />
          <FilterChip label={`kind: ${props.filters().kind ?? "all"}`} active={!!props.filters().kind} styles={props.styles} />
          <FilterChip label={`severity: ${props.filters().severity ?? "all"}`} active={!!props.filters().severity} styles={props.styles} />
        </box>
      </Show>

      <scrollbox>
        <Show when={props.section() === "overview"}>
          <Section title="AGENTS" styles={props.styles}>
            <AgentDefinitionList definitions={props.definitions} styles={props.styles} compact={narrow()} />
          </Section>

          <MetricGrid
            items={[
              { label: "RUNNING", value: counts().running, color: props.styles.success },
              { label: "WAITING", value: counts().waiting, color: props.styles.warning, hint: "derived" },
              { label: "COMPLETED", value: counts().completed, color: props.styles.info },
              { label: "FAILED", value: counts().failed, color: props.styles.error },
            ]}
            styles={props.styles}
            width={props.width ?? 80}
          />

          <Show when={activity()} keyed fallback={<EmptyState message="No current activity" hint="Activity appears when an agent runs a tool" styles={props.styles} />}>
            {(current: ActivityView) => (
              <Section title="CURRENT ACTIVITY" styles={props.styles}>
                <KeyValue label="Agent" value={current.agent ?? "Unavailable"} styles={props.styles} primary />
                <KeyValue label="Tool" value={current.tool?.name ?? "Unavailable"} styles={props.styles} />
                <KeyValue
                  label="File"
                  value={current.file?.path ? `${current.file.path} (${current.file.evidence})` : "Unavailable"}
                  styles={props.styles}
                />
              </Section>
            )}
          </Show>
        </Show>

        <Show when={props.section() === "timeline"}>
          <Section title="TIMELINE" styles={props.styles}>
            <Show
              when={events().length > 0}
              fallback={<EmptyState message="No observable events" hint="Events appear as agents run tools and request permissions" styles={props.styles} />}
            >
              <For each={events()}>
                {(event) => (
                  <EventRow
                    event={event}
                    agent={event.sessionID ? props.agentFor(event.sessionID) : undefined}
                    styles={props.styles}
                    showTime={!narrow()}
                    detail={eventDetail(event)}
                    durationMs={eventDuration(event, props.timeline().events)}
                  />
                )}
              </For>
            </Show>
          </Section>
        </Show>

        <Show when={props.section() === "harness"}>
          <HarnessPanel report={props.harness} styles={props.styles} />
        </Show>

        <Show when={props.section() === "usage"}>
          <UsagePanel
            usage={props.usage}
            estimate={props.estimate}
            nodes={props.nodes}
            project={props.project}
            evidence={props.evidence}
            settings={props.settings}
            styles={props.styles}
            width={props.width}
          />
        </Show>
      </scrollbox>

      <Show when={props.sessionID && narrow()}>
        <text fg={props.styles.faint}>Session: {truncate(props.sessionID ?? "", 16)}</text>
      </Show>
    </AppShell>
  )
}
