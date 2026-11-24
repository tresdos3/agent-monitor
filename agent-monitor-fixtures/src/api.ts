export interface User {
  readonly id: string
  readonly name: string
}

const users = new Map<string, User>([["1", { id: "1", name: "Ada" }]])

export function getUser(id: string): User | undefined {
  return users.get(id)
}

export function addUser(user: User): void {
  users.set(user.id, user)
}

// Fixture change: modified file for Agent Monitor Git status testing.
export function userCount(): number {
  return users.size
}

export function removeUser(id: string): boolean {
  return users.delete(id)
}

// Small harmless change for Agent Monitor API-work scenario.
export function isKnownUser(id: string): boolean {
  return users.has(id)
}

// Delegation metadata: parent (orchestrator) session that assigned this API work.
// Recorded by this backend-agent child from its host session parent_id.
export const PARENT_SESSION_ID = "ses_df2363823ffeEqt89m2FynExh7"


// Fixture change: modified file for Git status testing.
