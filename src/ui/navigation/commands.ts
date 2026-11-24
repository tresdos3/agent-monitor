import type { AgentNode } from "../../domain/model.js"

export interface PaletteCommand {
  readonly id: string
  readonly title: string
  readonly palette: true
  readonly run: () => void
}

export type SessionCommand = PaletteCommand

/** Palette commands that navigate to the native the host TUI session. */
export function sessionCommands(
  nodes: readonly AgentNode[],
  navigate: (sessionID: string) => void,
): readonly SessionCommand[] {
  return nodes.slice(0, 12).map((node) => ({
    id: `agent-monitor.session.${node.id}`,
    title: `Agent Monitor: open ${node.label}`,
    palette: true as const,
    run: () => navigate(node.id),
  }))
}
