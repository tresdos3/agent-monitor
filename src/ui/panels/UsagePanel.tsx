import { For, Show } from "solid-js"
import { usageByAgent, usageByModel } from "../../application/usage.js"
import type { AgentNode, TokenUsage } from "../../domain/model.js"
import type {
  MonitorSettings,
  PricingEstimate,
  ProjectView,
  TestEvidence,
  UsageSnapshot,
} from "../../domain/project.js"
import { KeyValue } from "../components/KeyValue.js"
import { MetricGrid } from "../components/MetricGrid.js"
import { MiniBar } from "../components/MiniBar.js"
import { Section } from "../components/Section.js"
import { UnavailableState } from "../components/UnavailableState.js"
import { UsageBreakdown } from "../components/UsageBreakdown.js"
import { compactNumber } from "../components/format.js"
import type { Styles } from "../theme.js"

export interface UsagePanelProps {
  readonly usage: () => UsageSnapshot | undefined
  readonly estimate: () => PricingEstimate | undefined
  readonly nodes: () => readonly AgentNode[]
  readonly project: () => ProjectView
  readonly evidence: () => readonly TestEvidence[]
  readonly settings: () => MonitorSettings
  readonly styles: Styles
  readonly width?: number
}

export function UsagePanel(props: UsagePanelProps) {
  const tokens = (): TokenUsage | undefined => {
    const usage = props.usage()
    if (!usage || usage.input === undefined || usage.output === undefined || usage.reasoning === undefined || usage.cacheRead === undefined || usage.cacheWrite === undefined) {
      return undefined
    }
    return {
      input: usage.input,
      output: usage.output,
      reasoning: usage.reasoning,
      cacheRead: usage.cacheRead,
      cacheWrite: usage.cacheWrite,
    }
  }
  const cached = () => {
    const value = tokens()
    return value ? value.cacheRead + value.cacheWrite : undefined
  }
  const agents = () => usageByAgent(props.nodes())
  const models = () => usageByModel(props.nodes())
  const agentMax = () => Math.max(...agents().map((entry) => entry.total), 1)
  const modelMax = () => Math.max(...models().map((entry) => entry.total), 1)
  const counts = () => {
    const files = props.project().changedFiles
    return {
      added: files.filter((file) => file.status === "added").length,
      modified: files.filter((file) => file.status === "modified").length,
      deleted: files.filter((file) => file.status === "deleted").length,
    }
  }

  return (
    <box flexDirection="column" gap={1}>
      <Section title="TOKEN METRICS" styles={props.styles}>
        <MetricGrid
          items={[
            { label: "INPUT", value: compactNumber(props.usage()?.input), color: props.styles.info },
            { label: "OUTPUT", value: compactNumber(props.usage()?.output), color: props.styles.success },
            { label: "CACHED", value: compactNumber(cached()), color: props.styles.muted },
            { label: "REASONING", value: compactNumber(props.usage()?.reasoning), color: props.styles.warning },
            { label: "TOTAL", value: compactNumber(props.usage()?.total), color: props.styles.action },
          ]}
          styles={props.styles}
          width={props.width ?? 80}
        />
        <UsageBreakdown tokens={tokens} styles={props.styles} />
      </Section>

      <Section title="USAGE BY AGENT" styles={props.styles}>
        <Show when={agents().length > 0} fallback={<UnavailableState label="No agent usage observed" styles={props.styles} />}>
          <For each={agents()}>
            {(entry) => (
              <box flexDirection="row" gap={1}>
                <text fg={props.styles.base}>{entry.label}</text>
                <MiniBar value={entry.total} max={agentMax()} styles={props.styles} color={props.styles.info} width={8} />
                <text fg={props.styles.muted}>{compactNumber(entry.total)}</text>
                <Show when={entry.model}>
                  {(model: string) => <text fg={props.styles.faint}>{model}</text>}
                </Show>
              </box>
            )}
          </For>
        </Show>
      </Section>

      <Section title="USAGE BY MODEL" styles={props.styles}>
        <Show when={models().length > 0} fallback={<UnavailableState label="No model usage available" styles={props.styles} />}>
          <For each={models()}>
            {(entry) => (
              <box flexDirection="row" gap={1}>
                <text fg={props.styles.base}>{entry.model}</text>
                <MiniBar value={entry.total} max={modelMax()} styles={props.styles} color={props.styles.success} width={8} />
                <text fg={props.styles.muted}>{compactNumber(entry.total)}</text>
              </box>
            )}
          </For>
        </Show>
      </Section>

      <Section title="COST" styles={props.styles}>
        <KeyValue label="Reported" value={props.usage()?.reportedCost === undefined ? "Unavailable" : String(props.usage()?.reportedCost)} styles={props.styles} />
        <Show when={props.settings().showEstimate} fallback={<text fg={props.styles.faint}>Estimate hidden — toggle with Agent Monitor: toggle cost estimate</text>}>
          <Show when={props.estimate()} keyed fallback={<UnavailableState label="Estimated: Unavailable" styles={props.styles} />}>
            {(estimate: PricingEstimate) => (
              <box flexDirection="column">
                <KeyValue label="Estimated" value={estimate.amount.toFixed(4)} styles={props.styles} valueColor={props.styles.warning} primary />
                <text fg={props.styles.faint}>
                  {estimate.source} · v{estimate.version} · {estimate.date}
                </text>
              </box>
            )}
          </Show>
        </Show>
      </Section>

      <Section title="PROJECT CONTEXT" styles={props.styles}>
        <KeyValue label="Branch" value={props.project().branch ?? "Unavailable"} styles={props.styles} />
        <KeyValue
          label="Changed"
          value={`${props.project().changedFiles.length} (${counts().added}+ ${counts().modified}~ ${counts().deleted}-)`}
          styles={props.styles}
        />
        <Show when={props.evidence().length > 0} fallback={<text fg={props.styles.faint}>No observed test/build execution</text>}>
          <For each={props.evidence().slice(0, 3)}>
            {(item) => (
              <text fg={item.status === "passed" ? props.styles.success : props.styles.error}>
                {item.status === "passed" ? "✓" : "✕"} {item.command} · {item.evidence}
              </text>
            )}
          </For>
        </Show>
      </Section>
    </box>
  )
}
