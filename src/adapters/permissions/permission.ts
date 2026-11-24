import type { PermissionRequest } from "@opencode/client"
import type { NormalizedEvent } from "../../domain/model.js"

export interface PermissionView {
  readonly id: string
  readonly sessionID: string
  readonly action: string
  readonly resources: readonly string[]
  readonly toolID?: string
  readonly message?: string
  readonly requestedAt?: number
  readonly agent?: string
  readonly status: "pending" | "resolved"
}

interface PermissionInput {
  readonly id?: unknown
  readonly sessionID?: unknown
  readonly action?: unknown
  readonly resources?: unknown
  readonly source?: unknown
  readonly message?: unknown
}

interface ViewOptions {
  readonly requestedAt?: number
  readonly agent?: string
  readonly status?: PermissionView["status"]
}

function readSourceTool(source: unknown): string | undefined {
  if (typeof source !== "object" || source === null) return undefined
  const id = (source as { id?: unknown }).id
  return typeof id === "string" && id.length > 0 ? id : undefined
}

export function permissionToView(input: PermissionInput, options: ViewOptions = {}): PermissionView {
  const resources = Array.isArray(input.resources)
    ? input.resources.filter((resource): resource is string => typeof resource === "string")
    : []

  return {
    id: String(input.id ?? "unknown"),
    sessionID: String(input.sessionID ?? "unknown"),
    action: typeof input.action === "string" ? input.action : "unknown",
    resources,
    toolID: readSourceTool(input.source),
    message: typeof input.message === "string" ? input.message : undefined,
    requestedAt: options.requestedAt,
    agent: options.agent,
    status: options.status ?? "pending",
  }
}

export function permissionRequestToView(request: PermissionRequest, options: ViewOptions = {}): PermissionView {
  return permissionToView(request, options)
}

/** Build a view from the observable `permission.asked` event. */
export function permissionFromEvent(event: NormalizedEvent, options: ViewOptions = {}): PermissionView | undefined {
  if (event.kind !== "permission.asked") return undefined
  return permissionToView(event.data, { ...options, requestedAt: event.created })
}
