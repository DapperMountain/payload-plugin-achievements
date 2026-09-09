import type { PayloadRequest, Where } from 'payload'

import { collectionOf } from '../../collections/helpers.js'
import { syncTierChangedLog } from './recordEvent.js'
import { relationId } from './relationId.js'

export type ReleaseReviewGateResult = {
  requestsApproved: number
  /** `tier.changed` rows written for users who newly resolve past the released gate. */
  tierLogsWritten?: number
}

type UserScopePair = { userId: string; scopeId: string | null }

function addUserScopePair(
  pairs: Map<string, UserScopePair>,
  userId: string | null,
  scopeId: string | null,
): void {
  if (!userId) return
  const key = `${userId}::${scopeId ?? ''}`
  if (!pairs.has(key)) pairs.set(key, { userId, scopeId })
}

/**
 * When a definition stops requiring review, approve each pending request for that
 * definition so existing grant / tier.changed hooks run for that user + scope only.
 */
export async function releasePendingAchievementReviews(args: {
  req: PayloadRequest
  achievementId: string
}): Promise<ReleaseReviewGateResult> {
  const pending = await args.req.payload.find({
    collection: collectionOf('achievementRequests'),
    depth: 0,
    limit: 5000,
    pagination: false,
    overrideAccess: true,
    req: args.req,
    where: {
      and: [
        { achievement: { equals: args.achievementId } },
        { status: { equals: 'pending' } },
      ],
    },
  })

  let requestsApproved = 0
  for (const doc of pending.docs) {
    const id = relationId((doc as { id?: unknown }).id)
    if (!id) continue
    await args.req.payload.update({
      collection: collectionOf('achievementRequests'),
      id,
      data: { status: 'approved' },
      depth: 0,
      overrideAccess: true,
      req: args.req,
    })
    requestsApproved += 1
  }

  return { requestsApproved }
}

/**
 * When a tier stops requiring review:
 * 1. Approve pending tier requests (their afterChange hooks sync `tier.changed`).
 * 2. Sync `tier.changed` for every (user, scope) that may now resolve to this rung —
 *    including members who already met unlock rules but never had a pending request
 *    (UI would otherwise show the new rank with no audit log until Repair).
 */
export async function releasePendingTierReviews(args: {
  req: PayloadRequest
  tierId: string
}): Promise<ReleaseReviewGateResult> {
  const pending = await args.req.payload.find({
    collection: collectionOf('tierRequests'),
    depth: 0,
    limit: 5000,
    pagination: false,
    overrideAccess: true,
    req: args.req,
    where: {
      and: [{ tier: { equals: args.tierId } }, { status: { equals: 'pending' } }],
    },
  })

  let requestsApproved = 0
  for (const doc of pending.docs) {
    const id = relationId((doc as { id?: unknown }).id)
    if (!id) continue
    await args.req.payload.update({
      collection: collectionOf('tierRequests'),
      id,
      data: { status: 'approved' },
      depth: 0,
      overrideAccess: true,
      req: args.req,
    })
    requestsApproved += 1
  }

  const tier = (await args.req.payload.findByID({
    collection: collectionOf('tiers'),
    id: args.tierId,
    depth: 0,
    overrideAccess: true,
    req: args.req,
  })) as { scope?: unknown } | null
  const tierScopeId = relationId(tier?.scope)

  const pairs = new Map<string, UserScopePair>()

  const allRequests = await args.req.payload.find({
    collection: collectionOf('tierRequests'),
    depth: 0,
    limit: 5000,
    pagination: false,
    overrideAccess: true,
    req: args.req,
    where: { tier: { equals: args.tierId } },
  })
  for (const doc of allRequests.docs) {
    addUserScopePair(
      pairs,
      relationId((doc as { user?: unknown }).user),
      tierScopeId ?? relationId((doc as { scope?: unknown }).scope),
    )
  }

  const grantWhere: Where = tierScopeId
    ? { scope: { equals: tierScopeId } }
    : {
        or: [{ scope: { exists: false } }, { scope: { equals: null } }],
      }
  const grants = await args.req.payload.find({
    collection: collectionOf('grants'),
    depth: 0,
    limit: 5000,
    pagination: false,
    overrideAccess: true,
    req: args.req,
    where: grantWhere,
  })
  for (const doc of grants.docs) {
    addUserScopePair(
      pairs,
      relationId((doc as { user?: unknown }).user),
      tierScopeId ?? relationId((doc as { scope?: unknown }).scope),
    )
  }

  let tierLogsWritten = 0
  for (const pair of pairs.values()) {
    const log = await syncTierChangedLog({
      payload: args.req.payload,
      req: args.req,
      userId: pair.userId,
      scopeId: pair.scopeId,
    })
    if (log) tierLogsWritten += 1
  }

  return { requestsApproved, tierLogsWritten }
}

/** True when `requiresReview` flipped from required → not required. */
export function didDisableRequiresReview(
  previousDoc: { requiresReview?: boolean | null } | null | undefined,
  doc: { requiresReview?: boolean | null } | null | undefined,
): boolean {
  return previousDoc?.requiresReview === true && doc?.requiresReview !== true
}
