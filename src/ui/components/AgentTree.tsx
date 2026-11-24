import { For, Show } from "solid-js"
import { selectAgentTree } from "../../application/selectors.js"
import type { AgentNode } from "../../domain/model.js"
import type { Styles } from "../theme.js"
import { AgentRow } from "./AgentRow.js"
import { EmptyState } from "./EmptyState.js"

export interface AgentTreeProps {
  readonly nodes: () => readonly AgentNode[]
  readonly pendingBySession: () => ReadonlyMap<string, number>
  readonly styles: Styles
  readonly compact?: boolean
}

export function AgentTree(props: AgentTreeProps) {
  const tree = () => selectAgentTree(props.nodes())
  return (
    <Show when={tree().length > 0} fallback={<EmptyState message="No agents observed" hint="Start a session to see agent activity" styles={props.styles} />}>
      <For each={tree()}>
        {(entry) => (
          <AgentRow
            node={entry.node}
            depth={entry.depth}
            pending={props.pendingBySession().get(entry.node.id) ?? 0}
            styles={props.styles}
            compact={props.compact}
          />
        )}
      </For>
    </Show>
  )
}
