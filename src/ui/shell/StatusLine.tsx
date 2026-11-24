import { For } from "solid-js"
import type { Styles } from "../theme.js"

export type StatusTone = "success" | "warning" | "error" | "info" | "muted"

export interface StatusItem {
  readonly label: string
  readonly value: string | number
  readonly tone?: StatusTone
}

export interface StatusLineProps {
  readonly items: readonly StatusItem[]
  readonly styles: Styles
}

export function StatusLine(props: StatusLineProps) {
  const toneColor = (item: StatusItem) => {
    switch (item.tone ?? "muted") {
      case "success":
        return props.styles.success
      case "warning":
        return props.styles.warning
      case "error":
        return props.styles.error
      case "info":
        return props.styles.info
      default:
        return props.styles.muted
    }
  }

  return (
    <box flexDirection="row" gap={2}>
      <For each={props.items}>
        {(item) => (
          <box flexDirection="row" gap={1}>
            <text fg={props.styles.faint}>{item.label}</text>
            <text fg={toneColor(item)}>{item.value}</text>
          </box>
        )}
      </For>
    </box>
  )
}
