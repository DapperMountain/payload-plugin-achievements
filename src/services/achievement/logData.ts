/**
 * Shared engine shape for achievement-log `data` on system event types.
 * Hosts may add extra keys; readers should treat unknown keys as opaque.
 *
 * Transition events always use `from` / `to` (either side may be null):
 * - `tier.changed` — previous ladder step → current step
 * - `achievement.granted` — `from: null`, `to: achievement`
 * - `achievement.revoked` — `from: achievement`, `to: null`
 */
export type CatalogRef = {
  id: string
  slug?: string
}

export type TransitionLogData = {
  from: CatalogRef | null
  to: CatalogRef | null
}

export function catalogRef(id: string, slug?: string | null): CatalogRef {
  return {
    id,
    ...(typeof slug === 'string' && slug.length > 0 ? { slug } : {}),
  }
}

export function transitionLogData(args: {
  from?: { id: string; slug?: string | null } | null
  to?: { id: string; slug?: string | null } | null
}): TransitionLogData {
  return {
    from: args.from ? catalogRef(args.from.id, args.from.slug) : null,
    to: args.to ? catalogRef(args.to.id, args.to.slug) : null,
  }
}

/** Read the “current” catalog id from a log `data` blob (new or legacy shapes). */
export function transitionToId(data: unknown): string | null {
  if (!data || typeof data !== 'object' || Array.isArray(data)) return null
  const record = data as Record<string, unknown>
  const to = record.to
  if (to && typeof to === 'object' && !Array.isArray(to)) {
    const id = (to as { id?: unknown }).id
    if (typeof id === 'string' && id) return id
  }
  // Legacy tier.changed / achievement.* shapes
  if (typeof record.tier === 'string' && record.tier) return record.tier
  if (typeof record.achievement === 'string' && record.achievement) return record.achievement
  return null
}
