import { Show } from "solid-js"
import type { NormalizedEvent } from "../../domain/model.js"
import { formatDuration } from "./format.js"
import { severityColor, type Styles } from "../theme.js"

export interface EventRowProps {
  readonly event: NormalizedEvent
  readonly agent?: string
  readonly styles: Styles
  readonly showTime?: boolean
  readonly detail?: string
  readonly durationMs?: number
}

function glyph(severity: NormalizedEvent["severity"]): string {
  switch (severity) {
    case "error":
      return "✕"
    case "warning":
      return "◷"
    case "success":
      return "✓"
    default:
      return "●"
  }
}

function clock(created: number): string {
  return new Date(created).toISOString().slice(11, 19)
}

export function EventRow(props: EventRowProps) {
  return (
    <box flexDirection="column">
      <box flexDirection="row" gap={1}>
        <Show when={props.showTime !== false}>
          <text fg={props.styles.faint}>{clock(props.event.created)}</text>
        </Show>
        <text fg={severityColor(props.styles, props.event.severity)}>{glyph(props.event.severity)}</text>
        <text fg={props.styles.muted}>{props.event.sourceType}</text>
        <text fg={props.styles.base}>{props.event.title}</text>
        <Show when={props.agent}>
          {(agent: string) => <text fg={props.styles.muted}>· {agent}</text>}
        </Show>
      </box>
      <Show when={props.detail || props.durationMs !== undefined}>
        <box flexDirection="row" gap={1}>
          <Show when={props.detail} keyed>
            {(detail: string) => <text fg={props.styles.faint}>{detail}</text>}
          </Show>
          <Show when={props.durationMs !== undefined}>
            <text fg={props.styles.info}>{formatDuration(props.durationMs)}</text>
          </Show>
        </box>
      </Show>
    </box>
  )
}
