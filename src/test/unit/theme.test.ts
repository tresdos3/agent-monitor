import { describe, expect, it } from "vitest"
import { createStyles, evidenceColor, severityColor, statusColor, truncate } from "../../ui/theme.js"
import { historyLabel } from "../../ui/components/format.js"

const theme = {
  text: {
    base: "#ffffff",
    muted: "#aaaaaa",
    faint: "#666666",
    action: { primary: { base: "#00aaff" } },
    feedback: {
      error: { base: "#ff0000", muted: "#aa0000" },
      warning: { base: "#ffaa00", muted: "#aa7700" },
      success: { base: "#00cc66", muted: "#008844" },
      info: { base: "#4488ff", muted: "#2255aa" },
    },
  },
  border: { base: "#444444" },
  background: { raised: { base: "#111111" } },
  scrollbar: { base: "#555555" },
} as unknown as Parameters<typeof createStyles>[0]

describe("theme styles", () => {
  const styles = createStyles(theme)

  it("maps semantic tokens", () => {
    expect(styles.base).toBe("#ffffff")
    expect(styles.success).toBe("#00cc66")
    expect(styles.action).toBe("#00aaff")
  })

  it("maps severity, evidence, and status colors", () => {
    expect(severityColor(styles, "error")).toBe(styles.error)
    expect(severityColor(styles, "warning")).toBe(styles.warning)
    expect(evidenceColor(styles, "verified")).toBe(styles.success)
    expect(evidenceColor(styles, "missing")).toBe(styles.faint)
    expect(statusColor(styles, "running")).toBe(styles.success)
    expect(statusColor(styles, "failed")).toBe(styles.error)
  })

  it("labels history state honestly", () => {
    expect(historyLabel("ready")).toBe("ready")
    expect(historyLabel("loading")).toBe("loading")
    expect(historyLabel("unavailable")).toBe("live-only")
  })

  it("truncates long values", () => {
    expect(truncate("abcdef", 4)).toBe("abc…")
    expect(truncate("abc", 4)).toBe("abc")
  })
})
