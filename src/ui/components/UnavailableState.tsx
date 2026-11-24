import type { Styles } from "../theme.js"

export interface UnavailableStateProps {
  readonly label?: string
  readonly styles: Styles
}

/** Explicitly states that data is missing instead of rendering a misleading empty value. */
export function UnavailableState(props: UnavailableStateProps) {
  return <text fg={props.styles.faint}>{props.label ?? "Unavailable"}</text>
}
