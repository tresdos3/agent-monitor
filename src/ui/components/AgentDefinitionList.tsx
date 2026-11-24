import { For, Show } from "solid-js"
import type { AgentDefinition } from "../../domain/agents.js"
import { truncate } from "../theme.js"
import type { Styles } from "../theme.js"
import { EmptyState } from "./EmptyState.js"

export interface AgentDefinitionListProps {
  readonly definitions: () => readonly AgentDefinition[]
  readonly styles: Styles
  readonly compact?: boolean
}

export function AgentDefinitionList(props: AgentDefinitionListProps) {
  return (
    <Show
      when={props.definitions().length > 0}
      fallback={<EmptyState message="No agent definitions" hint="Add agents in .opencode/agents/" styles={props.styles} />}
    >
      <For each={props.definitions()}>
        {(definition) => {
          const stateColor = () => {
            switch (definition.status) {
              case "running":
                return props.styles.success
              case "completed":
                return props.styles.info
              case "failed":
                return props.styles.error
              case "idle":
                return props.styles.muted
              default:
                return props.styles.faint
            }
          }
          const glyph = () => {
            switch (definition.status) {
              case "running":
                return "●"
              case "completed":
                return "✓"
              case "failed":
                return "✕"
              default:
                return "○"
            }
          }
          const roleColor = () => (definition.mode === "primary" ? props.styles.action : props.styles.info)
          const roleLabel = () => (definition.mode === "primary" ? "PRIMARY" : definition.mode === "all" ? "BOTH" : "SUBAGENT")
          return (
            <box flexDirection="column">
              <box flexDirection="row" gap={1}>
                <text fg={stateColor()}>{glyph()}</text>
                <text fg={roleColor()}>{definition.name}</text>
                <text fg={roleColor()}>{roleLabel()}</text>
                <Show when={definition.statusNote} keyed>
                  {(note: string) => <text fg={props.styles.warning}>{note}</text>}
                </Show>
              </box>
              <Show when={!props.compact && definition.description} keyed>
                {(description: string) => <text fg={props.styles.faint}>{truncate(description, 52)}</text>}
              </Show>
            </box>
          )
        }}
      </For>
    </Show>
  )
}
