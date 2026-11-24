import { Show } from "solid-js"
import type { Styles } from "../theme.js"

export interface AppHeaderProps {
  readonly title: string
  readonly subtitle?: string
  readonly live?: boolean
  readonly styles: Styles
}

export function AppHeader(props: AppHeaderProps) {
  return (
    <box flexDirection="row" gap={2}>
      <text fg={props.styles.action}>
        <strong>{props.title}</strong>
      </text>
      <Show when={props.subtitle} keyed>
        {(subtitle: string) => <text fg={props.styles.muted}>{subtitle}</text>}
      </Show>
      <Show when={props.live}>
        <text fg={props.styles.success}>● LIVE</text>
      </Show>
    </box>
  )
}
