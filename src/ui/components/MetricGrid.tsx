import type { RGBA } from "@opentui/core"
import { For } from "solid-js"
import { metricColumns } from "../layout.js"
import type { Styles } from "../theme.js"
import { MetricCard } from "./MetricCard.js"

export interface MetricItem {
  readonly label: string
  readonly value: string | number
  readonly color: RGBA
  readonly hint?: string
}

export interface MetricGridProps {
  readonly items: readonly MetricItem[]
  readonly styles: Styles
  readonly width: number
}

export function MetricGrid(props: MetricGridProps) {
  const columns = () => metricColumns(props.width)
  const rows = () => {
    const result: MetricItem[][] = []
    for (let index = 0; index < props.items.length; index += columns()) {
      result.push(props.items.slice(index, index + columns()))
    }
    return result
  }
  return (
    <box flexDirection="column" gap={1}>
      <For each={rows()}>
        {(row) => (
          <box flexDirection="row" gap={1}>
            <For each={row}>
              {(item) => (
                <MetricCard label={item.label} value={item.value} color={item.color} hint={item.hint} styles={props.styles} />
              )}
            </For>
          </box>
        )}
      </For>
    </box>
  )
}
