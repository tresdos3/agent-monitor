import { Show } from "solid-js"
import { selectCurrentActivity, type ActivityView } from "../../application/selectors.js"
import type { AgentDefinition } from "../../domain/agents.js"
import { totalTokens, type AgentNode, type TimelineState, type TokenUsage } from "../../domain/model.js"
import { AgentDefinitionList } from "../components/AgentDefinitionList.js"
import { KeyValue } from "../components/KeyValue.js"
import { MiniBar } from "../components/MiniBar.js"
import { Section } from "../components/Section.js"
import { StatusBadge } from "../components/StatusBadge.js"
import { compactNumber, formatDuration } from "../components/format.js"
import type { Styles } from "../theme.js"

export interface SidebarProps {
  readonly sessionID: string
  readonly nodes: () => readonly AgentNode[]
  readonly definitions: () => readonly AgentDefinition[]
  readonly timeline: () => TimelineState
  readonly pendingBySession: () => ReadonlyMap<string, number>
  readonly loading: () => boolean
  readonly error: () => string | undefined
  readonly tokens: () => TokenUsage | undefined
  readonly cost: () => number | undefined
  readonly styles: Styles
  readonly compact?: boolean
}

export function Sidebar(props: SidebarProps) {
  const overview = () => {
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
  const total = () => {
    const tokens = props.tokens()
    return tokens ? totalTokens(tokens) : undefined
  }
  const activity = (): ActivityView | undefined => {
    const current = selectCurrentActivity(props.sessionID, props.timeline(), props.nodes())
    if (current) return current
    const node = props.nodes().find((candidate) => candidate.id === props.sessionID)
    return node ? { sessionID: node.id, agent: node.agent } : undefined
  }

  return (
    <box flexDirection="column" gap={1}>
      <text fg={props.styles.action}>
        <strong>AGENT MONITOR</strong>
      </text>

      <Show when={props.loading()}>
        <text fg={props.styles.muted}>Loading session data…</text>
      </Show>
      <Show when={props.error()} keyed>
        {(message: string) => <text fg={props.styles.error}>Error: {message}</text>}
      </Show>
      <Show when={!props.loading() && !props.error() && props.nodes().length === 0}>
        <text fg={props.styles.faint}>No agents observed</text>
      </Show>

      <Show when={props.nodes().length > 0}>
        <Section title="OVERVIEW" styles={props.styles}>
          <StatusBadge glyph="●" label={`Running  ${overview().running}`} color={props.styles.success} />
          <StatusBadge glyph="◷" label={`Waiting  ${overview().waiting} (derived)`} color={props.styles.warning} />
          <StatusBadge glyph="✓" label={`Completed  ${overview().completed}`} color={props.styles.info} />
          <StatusBadge glyph="✕" label={`Failed  ${overview().failed}`} color={props.styles.error} />
        </Section>
      </Show>

      <Section title="AGENTS" styles={props.styles}>
        <AgentDefinitionList definitions={props.definitions} styles={props.styles} compact={props.compact} />
      </Section>

      <Show when={!props.compact}>
        <Show when={activity()} keyed>
          {(current: ActivityView) => (
            <Section title="CURRENT ACTIVITY" styles={props.styles}>
              <KeyValue label="Agent" value={current.agent ?? "Unavailable"} styles={props.styles} />
              <KeyValue
                label="Tool"
                value={current.tool ? `${current.tool.name} (observed)` : "Unavailable"}
                styles={props.styles}
              />
              <KeyValue
                label="File"
                value={current.file ? `${current.file.path} (inferred)` : "Unavailable"}
                styles={props.styles}
              />
              <KeyValue label="Duration" value={formatDuration(current.durationMs)} styles={props.styles} />
            </Section>
          )}
        </Show>

        <Section title="USAGE" styles={props.styles}>
          <MiniBar value={props.tokens()?.input ?? 0} max={total() ?? 1} styles={props.styles} color={props.styles.info} />
          <KeyValue label="Input" value={compactNumber(props.tokens()?.input)} styles={props.styles} />
          <KeyValue label="Output" value={compactNumber(props.tokens()?.output)} styles={props.styles} />
          <KeyValue
            label="Cost"
            value={props.cost() === undefined ? "Unavailable" : `reported ${props.cost() ?? 0}`}
            styles={props.styles}
          />
        </Section>
      </Show>
    </box>
  )
}
