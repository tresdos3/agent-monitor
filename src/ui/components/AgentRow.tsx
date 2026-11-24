import { Show } from "solid-js"
import { isStale } from "../../application/selectors.js"
import type { AgentNode } from "../../domain/model.js"
import { statusGlyph } from "./format.js"
import { statusColor, type Styles } from "../theme.js"

export interface AgentRowProps {
  readonly node: AgentNode
  readonly depth: number
  readonly pending: number
  readonly styles: Styles
  readonly compact?: boolean
}

export function AgentRow(props: AgentRowProps) {
  const prefix = () => (props.depth === 0 ? "" : `${"  ".repeat(props.depth - 1)}└ `)
  const stale = () => isStale(props.node, Date.now(), 900_000)
  const color = () => statusColor(props.styles, props.node.status)

  return (
    <box flexDirection="column">
      <text fg={color()}>
        {prefix()}
        {statusGlyph(props.node.status)} {props.node.label}
        <Show when={!!props.node.parentID}>{` SUBAGENT`}</Show>
        <Show when={props.node.statusNote} keyed>
          {(note: string) => ` ${note}`}
        </Show>
        <Show when={props.pending > 0}>{` ◷ permission`}</Show>
        <Show when={stale()}>{` STALE`}</Show>
      </text>
      <Show when={!props.compact && !!props.node.currentTool}>
        <text fg={props.styles.muted}>
          {"  ".repeat(props.depth + 1)}Tool: {props.node.currentTool}
        </text>
      </Show>
      <Show when={!props.compact && !!props.node.currentFile}>
        <text fg={props.styles.faint}>
          {"  ".repeat(props.depth + 1)}File: {props.node.currentFile?.path} ({props.node.currentFile?.evidence})
        </text>
      </Show>
    </box>
  )
}
