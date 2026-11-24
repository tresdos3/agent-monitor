export function compactNumber(value: number | undefined): string {
  if (value === undefined) return "Unavailable"
  if (value >= 1000) return `${(value / 1000).toFixed(1)}k`
  return String(value)
}

export function formatDuration(ms: number | undefined): string {
  if (ms === undefined) return "Unavailable"
  const seconds = Math.floor(ms / 1000)
  const minutes = Math.floor(seconds / 60)
  const remainder = seconds % 60
  return `${String(minutes).padStart(2, "0")}:${String(remainder).padStart(2, "0")}`
}

export function historyLabel(status: "loading" | "ready" | "unavailable"): string {
  if (status === "ready") return "ready"
  if (status === "loading") return "loading"
  return "live-only"
}

export function statusGlyph(status: string): string {
  switch (status) {
    case "running":
      return "●"
    case "idle":
    case "unknown":
      return "?"
    case "completed":
      return "✓"
    case "failed":
      return "✕"
    default:
      return "?"
  }
}
