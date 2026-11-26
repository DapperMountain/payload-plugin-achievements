import type { PaginatedDocs, PayloadRequest, Where } from 'payload'
import { APIError } from 'payload'

import { collectionOf } from '../../collections/helpers.js'
import { getAchievementOptions } from '../../options-store.js'
import { relationId } from './relationId.js'

/**
 * Approve or reject a tier request. Ladder derivation runs in TierRequests afterChange.
 */
export async function reviewTierRequest(args: {
  req: PayloadRequest
  requestId: string
  decision: 'approved' | 'rejected'
  note?: string
}): Promise<Record<string, unknown>> {
  if (!args.req.user) throw new APIError('Unauthorized', 401)

  const { canReview } = getAchievementOptions()
  if (!canReview) throw new APIError('Forbidden', 403)

  const existing = (await args.req.payload.findByID({
    collection: collectionOf('tierRequests'),
    id: args.requestId,
    depth: 0,
    overrideAccess: true,
    req: args.req,
    select: { scope: true },
  })) as { scope?: unknown } | null

  if (!existing) throw new APIError('Not found', 404)

  const scopeId = relationId(existing.scope)
  if (!(await canReview(args.req.user, scopeId))) {
    throw new APIError('Forbidden', 403)
  }

  return (await args.req.payload.update({
    collection: collectionOf('tierRequests'),
    id: args.requestId,
    data: {
      status: args.decision,
      ...(args.note !== undefined ? { note: args.note } : {}),
    },
    overrideAccess: false,
    req: args.req,
    user: args.req.user,
  })) as Record<string, unknown>
}

export type FindTierRequestsForReviewArgs = {
  req: PayloadRequest
  /**
   * Product/tenant scope to list. Pass `null` for unscoped rows only.
   * Omit to list across scopes (requires `canReview(user, null)`).
   */
  scopeId?: string | null
  /** Defaults to pending only. */
  status?: 'pending' | 'rejected' | Array<'pending' | 'rejected'>
  limit?: number
  page?: number
  depth?: number
}

/**
 * Staff queue helper: list tier requests the current reviewer may act on.
 */
export async function findTierRequestsForReview(
  args: FindTierRequestsForReviewArgs,
): Promise<PaginatedDocs> {
  if (!args.req.user) throw new APIError('Unauthorized', 401)

  const { canReview } = getAchievementOptions()
  if (!canReview) throw new APIError('Forbidden', 403)

  const reviewScope = args.scopeId === undefined ? null : args.scopeId
  if (!(await canReview(args.req.user, reviewScope))) {
    throw new APIError('Forbidden', 403)
  }

  const statuses = Array.isArray(args.status)
    ? args.status
    : args.status
      ? [args.status]
      : (['pending'] as const)

  const clauses: Where[] = [{ status: { in: [...statuses] } }]
  if (args.scopeId !== undefined) {
    if (args.scopeId) {
      clauses.push({ scope: { equals: args.scopeId } })
    } else {
      clauses.push({ scope: { exists: false } })
    }
  }

  return args.req.payload.find({
    collection: collectionOf('tierRequests'),
    depth: args.depth ?? 1,
    limit: args.limit ?? 50,
    page: args.page ?? 1,
    overrideAccess: true,
    req: args.req,
    sort: '-createdAt',
    where: { and: clauses },
  })
}
