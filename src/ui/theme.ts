import type { Context } from "@opencode/plugin/tui/context"
import type { EvidenceLevel, Severity } from "../domain/model.js"

/** One place that turns the host TUI semantic tokens into monitor colors. */
export function createStyles(theme: Context["theme"]) {
  const feedback = theme.text.feedback
  return {
    base: theme.text.base,
    muted: theme.text.muted,
    faint: theme.text.faint,
    success: feedback.success.base,
    warning: feedback.warning.base,
    error: feedback.error.base,
    info: feedback.info.base,
    action: theme.text.action.primary.base,
    border: theme.border.base,
    surface: theme.background.raised.base,
    scrollbar: theme.scrollbar.base,
  }
}

export type Styles = ReturnType<typeof createStyles>

export function severityColor(styles: Styles, severity: Severity) {
  switch (severity) {
    case "error":
      return styles.error
    case "warning":
      return styles.warning
    case "success":
      return styles.success
    default:
      return styles.info
  }
}

export function evidenceGlyph(level: EvidenceLevel): string {
  switch (level) {
    case "verified":
      return "✓"
    case "observed":
      return "●"
    case "declared":
      return "◷"
    case "failed":
      return "✕"
    default:
      return "?"
  }
}

export function evidenceColor(styles: Styles, level: EvidenceLevel) {
  switch (level) {
    case "verified":
      return styles.success
    case "observed":
      return styles.info
    case "declared":
      return styles.warning
    case "failed":
      return styles.error
    default:
      return styles.faint
  }
}

export function statusColor(styles: Styles, status: string) {
  switch (status) {
    case "running":
      return styles.success
    case "completed":
      return styles.info
    case "failed":
      return styles.error
    case "idle":
      return styles.muted
    default:
      return styles.faint
  }
}

export function truncate(value: string, max: number): string {
  return value.length <= max ? value : `${value.slice(0, Math.max(0, max - 1))}…`
}
