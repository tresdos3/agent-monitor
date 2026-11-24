import type { RGBA } from "@opentui/core"
import { Show } from "solid-js"
import type { Styles } from "../theme.js"

export interface MiniBarProps {
  readonly value: number
  readonly max: number
  readonly styles: Styles
  readonly color: RGBA
  readonly width?: number
  readonly label?: string
  readonly suffix?: string
}

export function MiniBar(props: MiniBarProps) {
  const size = () => props.width ?? 12
  const filled = () => {
    if (!Number.isFinite(props.max) || props.max <= 0) return 0
    return Math.max(0, Math.min(size(), Math.round((props.value / props.max) * size())))
  }
  return (
    <box flexDirection="row" gap={1}>
      <Show when={props.label} keyed>
        {(label: string) => <text fg={props.styles.muted}>{label}</text>}
      </Show>
      <text fg={props.color}>{"█".repeat(filled())}</text>
      <text fg={props.styles.faint}>{"░".repeat(Math.max(0, size() - filled()))}</text>
      <Show when={props.suffix} keyed>
        {(suffix: string) => <text fg={props.styles.faint}>{suffix}</text>}
      </Show>
    </box>
  )
}
