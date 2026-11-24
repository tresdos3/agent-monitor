import type { Styles } from "../theme.js"

export interface FilterChipProps {
  readonly label: string
  readonly active: boolean
  readonly styles: Styles
  readonly visible?: boolean
}

/** Plain inline filter label; no rectangular border. */
export function FilterChip(props: FilterChipProps) {
  if (props.visible === false) return null
  const color = () => (props.active ? props.styles.action : props.styles.muted)
  const marker = () => (props.active ? "● " : "○ ")
  return <text fg={color()}>{marker()}{props.label}</text>
}
