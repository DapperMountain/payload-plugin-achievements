import type { AchievementPluginOptions } from './types'
import {
  resolveAdminGroup,
  resolveCollectionSlugs,
} from './collections/slugs'

export const DEFAULT_USERS_COLLECTION = 'users'
export const DEFAULT_ME_ENDPOINT_PATH = '/achievements/me'
export const DEFAULT_RECONCILE_ENDPOINT_PATH = '/achievements/reconcile'

export type ResolvedAchievementOptions = Omit<AchievementPluginOptions, 'users' | 'endpoints'> & {
  enabled: boolean
  usersCollectionSlug: string
  users: { includeJoins: boolean }
  /** Resolved collection slug map (after prefix + overrides). */
  collectionSlugs: ReturnType<typeof resolveCollectionSlugs>
  /** Admin nav group for plugin collections (`false` = ungrouped). */
  adminGroup: string | false
  endpoints: { me: string | false; reconcile: string | false }
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

export function resolveReconcileEndpointPath(path?: string | false): string | false {
  if (path === false) return false
  if (path == null) return DEFAULT_RECONCILE_ENDPOINT_PATH
  return normalizeEndpointPath(path, DEFAULT_RECONCILE_ENDPOINT_PATH)
}

export function resolveOptions(options: AchievementPluginOptions = {}): ResolvedAchievementOptions {
  return {
    ...options,
    enabled: options.enabled !== false,
    usersCollectionSlug: options.usersCollectionSlug ?? DEFAULT_USERS_COLLECTION,
    users: {
      includeJoins: options.users?.includeJoins !== false,
    },
    collectionSlugs: resolveCollectionSlugs(options),
    adminGroup: resolveAdminGroup(options),
    endpoints: {
      me: resolveMeEndpointPath(options.endpoints?.me),
      reconcile: resolveReconcileEndpointPath(options.endpoints?.reconcile),
    },
  }
}
