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
  readonly width?: number
}

/**
 * One terminal-native line of tabs. No per-tab rectangles; the active tab is
 * distinguished by foreground color and a leading marker. The rule is placed
 * first so the tab row survives tight vertical layouts.
 */
export function TabBar(props: TabBarProps) {
  const compact = () => props.showShortcuts === false || (props.width ?? 80) < 64
  const label = () => {
    const shortcut = (index: number) => (compact() ? "" : `[${index}] `)
    return props.tabs
      .map((tab, index) => {
        const isActive = tab.id === props.active
        const marker = isActive ? "▸ " : "  "
        return marker + shortcut(index + 1) + tab.label
      })
      .join("  ")
      .trimEnd()
  }
  return <text fg={props.styles.action}>{label()}</text>
}
