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
}

export function Section(props: SectionProps) {
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
