import { Show } from "solid-js"
import type { Styles } from "../theme.js"

export interface EmptyStateProps {
  readonly message: string
  readonly hint?: string
  readonly styles: Styles
}

export function EmptyState(props: EmptyStateProps) {
  return (
    <box flexDirection="column" gap={1}>
      <text fg={props.styles.muted}>{props.message}</text>
      <Show when={props.hint} keyed>
        {(hint: string) => <text fg={props.styles.faint}>{hint}</text>}
      </Show>
    </box>
  )
}
