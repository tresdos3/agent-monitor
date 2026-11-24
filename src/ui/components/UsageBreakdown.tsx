import { For, Show } from "solid-js"
import type { TokenUsage } from "../../domain/model.js"
import { compactNumber } from "./format.js"
import { MiniBar } from "./MiniBar.js"
import { UnavailableState } from "./UnavailableState.js"
import type { Styles } from "../theme.js"

export interface UsageBreakdownProps {
  readonly tokens: () => TokenUsage | undefined
  readonly styles: Styles
  readonly width?: number
}

export function UsageBreakdown(props: UsageBreakdownProps) {
  const tokens = () => props.tokens()
  const max = () => {
    const value = tokens()
    if (!value) return 1
    return Math.max(value.input, value.output, value.reasoning, value.cacheRead, value.cacheWrite, 1)
  }
  const rows = () => {
    const value = tokens()
    if (!value) return []
    return [
      { label: "Input", value: value.input, color: props.styles.info },
      { label: "Output", value: value.output, color: props.styles.success },
      { label: "Reasoning", value: value.reasoning, color: props.styles.warning },
      { label: "Cache read", value: value.cacheRead, color: props.styles.muted },
      { label: "Cache write", value: value.cacheWrite, color: props.styles.faint },
    ]
  }

  return (
    <Show when={tokens()} fallback={<UnavailableState label="Token breakdown unavailable" styles={props.styles} />}>
      <For each={rows()}>
        {(row) => (
          <box flexDirection="row" gap={1}>
            <text fg={props.styles.muted}>{row.label}</text>
            <MiniBar value={row.value} max={max()} styles={props.styles} color={row.color} width={props.width ?? 10} />
            <text fg={props.styles.base}>{compactNumber(row.value)}</text>
          </box>
        )}
      </For>
    </Show>
  )
}
