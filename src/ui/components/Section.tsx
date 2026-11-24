import type { JSX } from "@opentui/solid"
import type { RGBA } from "@opentui/core"
import type { Styles } from "../theme.js"

export interface SectionProps {
  readonly title: string
  readonly styles: Styles
  readonly children?: JSX.Element
  readonly grow?: boolean
  readonly padding?: number
  readonly titleColor?: RGBA
  /** "plain" (default) uses a text heading + rule; "boxed" keeps a subtle border. */
  readonly variant?: "plain" | "boxed"
  /** Content width, used to size the heading rule. */
  readonly width?: number
}

/** Level-2 heading. Borders are opt-in so data rows are not all boxed. */
export function Section(props: SectionProps) {
  if (props.variant === "boxed") {
    return (
      <box
        border
        borderColor={props.styles.border}
        title={props.title}
        titleColor={props.titleColor ?? props.styles.muted}
        gap={1}
        padding={props.padding ?? 1}
        flexGrow={props.grow ? 1 : undefined}
      >
        {props.children}
      </box>
    )
  }
  return (
    <box flexDirection="column" gap={0} flexGrow={props.grow ? 1 : undefined}>
      <text fg={props.titleColor ?? props.styles.muted}>{props.title}</text>
      <text fg={props.styles.border}>{"─".repeat(Math.max(6, Math.min((props.width ?? 80) - 4, 32)))}</text>
      <box flexDirection="column" gap={0} paddingLeft={1}>
        {props.children}
      </box>
    </box>
  )
}
