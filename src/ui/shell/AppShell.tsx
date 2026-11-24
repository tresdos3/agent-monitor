import type { JSX } from "@opentui/solid"
import { Show } from "solid-js"
import { allowTwoColumns, layoutMode } from "../layout.js"
import type { Styles } from "../theme.js"
import { AppHeader } from "./AppHeader.js"
import { StatusLine, type StatusItem } from "./StatusLine.js"
import { TabBar, type TabItem } from "./TabBar.js"

export interface AppShellProps {
  readonly title: string
  readonly subtitle?: string
  readonly live?: boolean
  readonly tabs: readonly TabItem[]
  readonly active: string
  readonly onSelect: (id: string) => void
  readonly status: readonly StatusItem[]
  readonly styles: Styles
  readonly width: number
  readonly height?: number
  readonly compact?: boolean
  readonly children: JSX.Element
  readonly aside?: JSX.Element
}

/** Responsive application shell: header, tabs, status line, and one or two content columns. */
export function AppShell(props: AppShellProps) {
  const mode = () => layoutMode(props.width)
  const twoColumns = () =>
    !props.compact &&
    allowTwoColumns(props.width) &&
    (props.height === undefined || props.height >= 22) &&
    props.aside !== undefined

  return (
    <box flexDirection="column" gap={0}>
      <AppHeader
        title={props.title}
        subtitle={mode() === "narrow" ? undefined : props.subtitle}
        live={props.live}
        styles={props.styles}
        activeTab={mode() === "narrow" ? props.tabs.find((tab) => tab.id === props.active)?.label : undefined}
      />
      <TabBar
        tabs={props.tabs}
        active={props.active}
        onSelect={props.onSelect}
        styles={props.styles}
        showShortcuts={mode() !== "narrow"}
        width={props.width}
      />
      <text fg={props.styles.border}>{"━".repeat(Math.max(8, Math.min(props.width, 120)))}</text>
      <StatusLine items={props.status} styles={props.styles} />
      <text fg={props.styles.faint}> </text>

      <Show
        when={twoColumns()}
        fallback={
          <box flexDirection="column" gap={1} flexGrow={1}>
            {props.children}
            <Show when={props.aside}>{props.aside}</Show>
          </box>
        }
      >
        <box flexDirection="row" gap={2} flexGrow={1}>
          <box flexDirection="column" gap={1} flexGrow={1} flexBasis="50%" minWidth={0}>
            {props.children}
          </box>
          <box flexDirection="column" gap={1} flexGrow={1} flexBasis="50%" minWidth={0}>
            {props.aside}
          </box>
        </box>
      </Show>
    </box>
  )
}
