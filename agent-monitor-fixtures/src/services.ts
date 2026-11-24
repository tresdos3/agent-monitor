import { addUser, getUser, type User } from "./api.js"
import { insert, read } from "./database.js"

export function onboard(user: User): boolean {
  if (getUser(user.id)) return false
  addUser(user)
  insert({ id: user.id, value: user.name })
  return read(user.id)?.value === user.name
}
