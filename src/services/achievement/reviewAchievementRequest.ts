import type { PayloadRequest } from 'payload'
import { APIError } from 'payload'

import { collectionOf } from '../../collections/helpers.js'
import { getAchievementOptions } from '../../options-store.js'
import { relationId } from './relationId.js'

/**
 * Approve or reject via collection update. Grant runs in afterChange when approved.
 */
export async function reviewAchievementRequest(args: {
  req: PayloadRequest
  requestId: string
  decision: 'approved' | 'rejected'
  note?: string
}) {
  if (!args.req.user) throw new APIError('Unauthorized', 401)

  const { canReview } = getAchievementOptions()
  if (!canReview) throw new APIError('Forbidden', 403)

  const existing = (await args.req.payload.findByID({
    collection: collectionOf('achievementRequests'),
    id: args.requestId,
    depth: 0,
    overrideAccess: true,
    req: args.req,
    select: { scope: true },
  })) as { scope?: unknown } | null

  const scopeId = relationId(existing?.scope)
  if (!(await canReview(args.req.user, scopeId))) {
    throw new APIError('Forbidden', 403)
  }

  return args.req.payload.update({
    collection: collectionOf('achievementRequests'),
    id: args.requestId,
    data: {
      status: args.decision,
      ...(args.note !== undefined ? { note: args.note } : {}),
    },
    overrideAccess: false,
    req: args.req,
    user: args.req.user,
  })
}
