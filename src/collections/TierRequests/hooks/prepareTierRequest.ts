import type {
  CollectionAfterChangeHook,
  CollectionBeforeValidateHook,
  PayloadRequest,
} from 'payload'
import { APIError } from 'payload'

import { collectionOf } from '../../../collections/helpers'
import { CTX_SYSTEM_REQUEST } from '../../../services/achievement/contextFlags'
import { syncTierChangedLog } from '../../../services/achievement/recordEvent'
import { relationId } from '../../../services/achievement/relationId'

function scopeIdOf(data: Record<string, unknown> | undefined): string | null {
  return relationId(data?.scope)
}

/**
 * System-created requests (reconcile / progression sync) may set user freely.
 * Member creates are not used for tiers in v1 — reviewers/system own the flow.
 */
export const prepareTierRequest: CollectionBeforeValidateHook = async ({
  data,
  operation,
  req,
  originalDoc,
}) => {
  if (!data) return data

  if (operation === 'create') {
    if (!req.context?.[CTX_SYSTEM_REQUEST]) {
      const userId = req.user?.id
      if (typeof userId !== 'string') throw new APIError('Unauthorized', 401)
      data.user = userId
    }

    const tierId = relationId((data as { tier?: unknown }).tier)
    if (!tierId) throw new APIError('tier required', 400)

    const tier = await req.payload.findByID({
      collection: collectionOf('tiers'),
      id: tierId,
      depth: 0,
      overrideAccess: true,
      req,
    })
    if (!tier) throw new APIError(`Unknown tier: ${tierId}`, 400)
    if ((tier as { requiresReview?: boolean }).requiresReview !== true) {
      throw new APIError('This tier does not require review.', 400)
    }

    data.tier = tierId
    if (!data.status) data.status = 'pending'
    return data
  }

  if (operation === 'update' && originalDoc) {
    data.user = (originalDoc as { user?: unknown }).user
    data.tier = (originalDoc as { tier?: unknown }).tier
  }

  return data
}

export const afterTierRequestChange: CollectionAfterChangeHook = async ({
  doc,
  operation,
  previousDoc,
  req,
}) => {
  const status = (doc as { status?: string }).status
  if (status !== 'approved') return doc

  const previousStatus =
    operation === 'update' ? (previousDoc as { status?: string } | undefined)?.status : undefined
  if (previousStatus === 'approved') return doc

  const userId = relationId((doc as { user?: unknown }).user)
  if (!userId) return doc

  const scopeId = scopeIdOf(doc as unknown as Record<string, unknown>)

  await syncTierChangedLog({
    payload: req.payload,
    req: req as PayloadRequest,
    userId,
    scopeId,
  })

  return doc
}
