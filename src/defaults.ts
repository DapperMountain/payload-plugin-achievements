import type { AchievementPluginOptions } from './types.js'
import {
  resolveAdminGroup,
  resolveCollectionSlugs,
} from './collections/slugs.js'

export const DEFAULT_USERS_COLLECTION = 'users'
export const DEFAULT_ME_ENDPOINT_PATH = '/achievements/me'
export const DEFAULT_LEADERBOARD_ENDPOINT_PATH = '/achievements/leaderboard'
export const DEFAULT_RECONCILE_ENDPOINT_PATH = '/achievements/reconcile'

export type ResolvedAchievementOptions = Omit<AchievementPluginOptions, 'users' | 'endpoints' | 'subjects'> & {
  enabled: boolean
  seedSystemCatalog: boolean
  usersCollectionSlug: string
  users: { includeJoins: boolean }
  /** Host collections allowed as polymorphic log subjects (empty = feature off). */
  subjectCollections: string[]
  /** Resolved collection slug map (after prefix + overrides). */
  collectionSlugs: ReturnType<typeof resolveCollectionSlugs>
  /** Admin nav group for plugin collections (`false` = ungrouped). */
  adminGroup: string | false
  endpoints: { me: string | false; leaderboard: string | false; reconcile: string | false }
}

/** Unique, non-empty collection slugs from plugin `subjects.collections`. */
export function resolveSubjectCollections(options?: AchievementPluginOptions): string[] {
  const raw = options?.subjects?.collections ?? []
  const seen = new Set<string>()
  const out: string[] = []
  for (const slug of raw) {
    const trimmed = typeof slug === 'string' ? slug.trim() : ''
    if (!trimmed || seen.has(trimmed)) continue
    seen.add(trimmed)
    out.push(trimmed)
  }
  return out
}

function normalizeEndpointPath(path: string, fallback: string): string {
  const trimmed = path.trim()
  if (!trimmed) return fallback
  return trimmed.startsWith('/') ? trimmed : `/${trimmed}`
}

export function resolveMeEndpointPath(me?: string | false): string | false {
  if (me === false) return false
  if (me == null) return DEFAULT_ME_ENDPOINT_PATH
  return normalizeEndpointPath(me, DEFAULT_ME_ENDPOINT_PATH)
}

export function resolveLeaderboardEndpointPath(path?: string | false): string | false {
  if (path === false) return false
  if (path == null) return DEFAULT_LEADERBOARD_ENDPOINT_PATH
  return normalizeEndpointPath(path, DEFAULT_LEADERBOARD_ENDPOINT_PATH)
}

export function resolveReconcileEndpointPath(path?: string | false): string | false {
  if (path === false) return false
  if (path == null) return DEFAULT_RECONCILE_ENDPOINT_PATH
  return normalizeEndpointPath(path, DEFAULT_RECONCILE_ENDPOINT_PATH)
}

export function resolveOptions(options: AchievementPluginOptions = {}): ResolvedAchievementOptions {
  const { subjects: _subjects, ...rest } = options
  // Idempotent: `setAchievementOptions(resolveOptions(opts))` strips `subjects` and would
  // otherwise wipe `subjectCollections` on the second pass.
  const fromConfig = resolveSubjectCollections(options)
  const alreadyResolved = (options as Partial<ResolvedAchievementOptions>).subjectCollections
  return {
    ...rest,
    enabled: options.enabled !== false,
    seedSystemCatalog: options.seedSystemCatalog !== false,
    usersCollectionSlug: options.usersCollectionSlug ?? DEFAULT_USERS_COLLECTION,
    users: {
      includeJoins: options.users?.includeJoins !== false,
    },
    subjectCollections:
      options.subjects != null ? fromConfig : (alreadyResolved ?? fromConfig),
    collectionSlugs: resolveCollectionSlugs(options),
    adminGroup: resolveAdminGroup(options),
    endpoints: {
      me: resolveMeEndpointPath(options.endpoints?.me),
      leaderboard: resolveLeaderboardEndpointPath(options.endpoints?.leaderboard),
      reconcile: resolveReconcileEndpointPath(options.endpoints?.reconcile),
    },
  }
}
