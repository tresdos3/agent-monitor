import { For } from "solid-js"
import type { Styles } from "../theme.js"

export interface TabItem {
  readonly id: string
  readonly label: string
}

export interface TabBarProps {
  readonly tabs: readonly TabItem[]
  readonly active: string
  readonly onSelect: (id: string) => void
  readonly styles: Styles
  readonly showShortcuts?: boolean
}

export function TabBar(props: TabBarProps) {
  return (
    <box flexDirection="row" gap={1}>
      <For each={props.tabs}>
        {(tab, index) => {
          const isActive = () => props.active === tab.id
          const color = () => (isActive() ? props.styles.action : props.styles.muted)
          return (
            <box border borderColor={color()} shouldFill={false}>
              <text fg={color()}>
                {props.showShortcuts === false ? "" : `[${index() + 1}] `}
                {tab.label}
              </text>
            </box>
          )
        }}
      </For>
    </box>
  )
}
