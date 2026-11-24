import type { Styles } from "../theme.js"

export interface FilterChipProps {
  readonly label: string
  readonly active: boolean
  readonly styles: Styles
  readonly visible?: boolean
}

export function FilterChip(props: FilterChipProps) {
  if (props.visible === false) return null
  const color = () => (props.active ? props.styles.action : props.styles.muted)
  return (
    <box border borderColor={color()} shouldFill={false}>
      <text fg={color()}>{props.label}</text>
    </box>
  )
}
