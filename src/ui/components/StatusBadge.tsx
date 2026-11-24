import type { RGBA } from "@opentui/core"
import { Show } from "solid-js"

export interface StatusBadgeProps {
  readonly glyph: string
  readonly label?: string
  readonly value?: string
  readonly color: RGBA
}

export function StatusBadge(props: StatusBadgeProps) {
  return (
    <box flexDirection="row" gap={1}>
      <text fg={props.color}>{props.glyph}</text>
      <Show when={props.label} keyed>
        {(label: string) => <text fg={props.color}>{label}</text>}
      </Show>
      <Show when={props.value} keyed>
        {(value: string) => <text fg={props.color}>{value}</text>}
      </Show>
    </box>
  )
}
