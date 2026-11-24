export interface Row {
  readonly id: string
  readonly value: string
}

const rows = new Map<string, Row>()

export function insert(row: Row): void {
  rows.set(row.id, row)
}

export function read(id: string): Row | undefined {
  return rows.get(id)
}
