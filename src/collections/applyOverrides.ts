import type { CollectionConfig } from 'payload'

import type { AchievementCollectionOverride } from '../types.js'

/**
 * Layer host overrides on a plugin collection:
 * - `access` / `admin` / `labels`: shallow merge (host wins per key)
 * - `hooks`: append host hook arrays after the plugin’s (plugin runs first)
 */
export function applyCollectionOverrides(
  collection: CollectionConfig,
  override?: AchievementCollectionOverride,
): CollectionConfig {
  if (!override) return collection

  const hooks: NonNullable<CollectionConfig['hooks']> = { ...(collection.hooks ?? {}) }
  if (override.hooks) {
    for (const key of Object.keys(override.hooks) as (keyof NonNullable<CollectionConfig['hooks']>)[]) {
      const hostHooks = override.hooks[key]
      if (hostHooks == null) continue
      const existing = hooks[key]
      const base = (Array.isArray(existing) ? existing : existing ? [existing] : []) as unknown[]
      const extra = (Array.isArray(hostHooks) ? hostHooks : [hostHooks]) as unknown[]
      // Payload hook slots are heterogeneous; append per-key after casting.
      ;(hooks as Record<string, unknown>)[key as string] = [...base, ...extra]
    }
  }

  return {
    ...collection,
    access: {
      ...collection.access,
      ...override.access,
    },
    admin: {
      ...collection.admin,
      ...override.admin,
    },
    ...(override.labels ? { labels: override.labels } : {}),
    hooks,
  }
}
