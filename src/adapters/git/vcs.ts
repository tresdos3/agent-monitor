import type { ChangedFile, ProjectView } from "../../domain/project.js"

export interface VcsInfoLike {
  readonly branch?: { readonly current?: string; readonly default?: string }
}

export interface VcsStatusLike {
  readonly data?: readonly {
    readonly file?: unknown
    readonly status?: unknown
    readonly additions?: unknown
    readonly deletions?: unknown
  }[]
}

function changedStatus(value: unknown): ChangedFile["status"] | undefined {
  if (value === "added" || value === "deleted" || value === "modified") return value
  return undefined
}

export function projectFromVcs(
  info: VcsInfoLike | undefined,
  status: VcsStatusLike | undefined,
  syncedAt = Date.now(),
): ProjectView {
  const changedFiles: ChangedFile[] = []
  for (const file of status?.data ?? []) {
    const path = file.file
    const state = changedStatus(file.status)
    if (typeof path !== "string" || !state) continue
    changedFiles.push({
      file: path,
      status: state,
      additions: typeof file.additions === "number" ? file.additions : undefined,
      deletions: typeof file.deletions === "number" ? file.deletions : undefined,
    })
  }

  return {
    branch: typeof info?.branch?.current === "string" ? info.branch.current : undefined,
    defaultBranch: typeof info?.branch?.default === "string" ? info.branch.default : undefined,
    changedFiles,
    syncedAt,
  }
}
