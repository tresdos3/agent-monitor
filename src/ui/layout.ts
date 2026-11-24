export type LayoutMode = "narrow" | "medium" | "wide"

export function layoutMode(width: number): LayoutMode {
  if (width < 64) return "narrow"
  if (width < 100) return "medium"
  return "wide"
}

export function allowTwoColumns(width: number): boolean {
  return layoutMode(width) !== "narrow"
}

export function metricColumns(width: number): number {
  const mode = layoutMode(width)
  if (mode === "narrow") return 1
  if (mode === "medium") return 2
  return 4
}
