import type { Where } from 'payload'

/** User (+ optional scope) filter without optional keys that break Where typing. */
export function userScopeWhere(userId: string, scopeId: string | null): Where {
  const clauses: Where[] = [{ user: { equals: userId } }]
  if (scopeId) clauses.push({ scope: { equals: scopeId } })
  return { and: clauses }
}

/**
 * Like {@link userScopeWhere}, but when `scopeId` is set also includes logs with no scope
 * (also matches rows with no scope — e.g. global events that still count toward a scoped ladder).
 */
export function userScopeIncludingUnscopedWhere(userId: string, scopeId: string | null): Where {
  if (!scopeId) return userScopeWhere(userId, null)
  return {
    and: [
      { user: { equals: userId } },
      {
        or: [{ scope: { equals: scopeId } }, { scope: { exists: false } }, { scope: { equals: null } }],
      },
    ],
  }
}
