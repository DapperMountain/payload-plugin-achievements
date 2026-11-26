import type {
  CollectionAfterChangeHook,
  CollectionBeforeValidateHook,
  PayloadRequest,
} from 'payload'
import { APIError } from 'payload'

import { collectionOf } from '../../../collections/helpers.js'
import { CTX_SYSTEM_REQUEST } from '../../../services/achievement/contextFlags.js'
import { evaluateRules } from '../../../services/achievement/evaluateRules.js'
import { catalogRef } from '../../../services/achievement/logData.js'
import { recordLog, syncTierChangedLog } from '../../../services/achievement/recordEvent.js'
import { relationId } from '../../../services/achievement/relationId.js'

function scopeIdOf(data: Record<string, unknown> | undefined): string | null {
  return relationId(data?.scope)
}

type TierDoc = {
  id: string
  slug?: string
  requiresReview?: boolean
  unlockRules?: unknown
}

const TIER_REQUEST_STATUS_EVENT: Record<string, string> = {
  pending: 'tier.request.submitted',
  approved: 'tier.request.approved',
  rejected: 'tier.request.rejected',
}

/**
 * System-created requests (reconcile / progression sync) may set user freely.
 * Member creates bind `req.user`, require unlock rules, and requireReview on the tier.
 */
export const prepareTierRequest: CollectionBeforeValidateHook = async ({
  data,
  operation,
  req,
  originalDoc,
}) => {
  if (!data) return data

  if (operation === 'create') {
    const system = Boolean(req.context?.[CTX_SYSTEM_REQUEST])

    if (!system) {
      const userId = req.user?.id
      if (typeof userId !== 'string') throw new APIError('Unauthorized', 401)
      data.user = userId
    } else {
      const bound = relationId((data as { user?: unknown }).user)
      if (!bound) throw new APIError('user required', 400)
      data.user = bound
    }

    const userId = relationId((data as { user?: unknown }).user)
    if (!userId) throw new APIError('user required', 400)

    const tierId = relationId((data as { tier?: unknown }).tier)
    if (!tierId) throw new APIError('tier required', 400)

    const tier = (await req.payload.findByID({
      collection: collectionOf('tiers'),
      id: tierId,
      depth: 0,
      overrideAccess: true,
      req,
    })) as TierDoc | null
    if (!tier) throw new APIError(`Unknown tier: ${tierId}`, 400)
    if (tier.requiresReview !== true) {
      throw new APIError('This tier does not require review.', 400)
    }

    data.tier = tierId

    if (!system) {
      const scopeId = scopeIdOf(data as Record<string, unknown>)
      const unlocked = await evaluateRules({
        payload: req.payload,
        req,
        rules: tier.unlockRules as never,
        userId,
        scopeId,
      })
      if (!unlocked) {
        throw new APIError('Unlock rules not met for this tier.', 400)
      }
      // Members cannot self-approve; only reviewers / system may set approved|rejected.
      data.status = 'pending'
    } else if (!data.status) {
      data.status = 'pending'
    }

    return data
  }

  if (operation === 'update' && originalDoc) {
    data.user = (originalDoc as { user?: unknown }).user
    data.tier = (originalDoc as { tier?: unknown }).tier

    const nextStatus = typeof data.status === 'string' ? data.status : undefined
    const prevStatus = (originalDoc as { status?: string }).status
    if (nextStatus === 'pending' && prevStatus && prevStatus !== 'pending') {
      const userId = relationId((originalDoc as { user?: unknown }).user)
      const tierId = relationId((originalDoc as { tier?: unknown }).tier)
      if (userId && tierId) {
        const tier = (await req.payload.findByID({
          collection: collectionOf('tiers'),
          id: tierId,
          depth: 0,
          overrideAccess: true,
          req,
        })) as TierDoc | null
        const scopeId = scopeIdOf({
          scope: (data as { scope?: unknown }).scope ?? (originalDoc as { scope?: unknown }).scope,
        })
        const unlocked = await evaluateRules({
          payload: req.payload,
          req,
          rules: (tier?.unlockRules ?? []) as never,
          userId,
          scopeId,
        })
        if (!unlocked) {
          throw new APIError('Unlock rules not met for this tier.', 400)
        }
      }
    }
  }

  return data
}

async function recordTierRequestStatusLog(args: {
  req: PayloadRequest
  doc: Record<string, unknown>
  previousStatus: string | null
  status: string
}): Promise<void> {
  const eventType = TIER_REQUEST_STATUS_EVENT[args.status]
  if (!eventType) return

  // Only log real transitions (and create-as-pending / create-as-approved).
  if (args.previousStatus === args.status) return

  const userId = relationId(args.doc.user)
  const tierId = relationId(args.doc.tier)
  if (!userId || !tierId) return

  const tier = (await args.req.payload.findByID({
    collection: collectionOf('tiers'),
    id: tierId,
    depth: 0,
    overrideAccess: true,
    req: args.req,
    select: { slug: true },
  })) as { slug?: string } | null

  const scopeId = scopeIdOf(args.doc)
  const requestId = typeof args.doc.id === 'string' ? args.doc.id : String(args.doc.id ?? '')

  await recordLog({
    payload: args.req.payload,
    req: args.req,
    userId,
    scopeId,
    type: eventType,
    actorId: typeof args.req.user?.id === 'string' ? args.req.user.id : undefined,
    data: {
      requestId,
      status: args.status,
      fromStatus: args.previousStatus,
      tier: catalogRef(tierId, tier?.slug),
    },
  })
}

export const afterTierRequestChange: CollectionAfterChangeHook = async ({
  doc,
  operation,
  previousDoc,
  req,
}) => {
  const userId = relationId((doc as { user?: unknown }).user)
  if (!userId) return doc

  const scopeId = scopeIdOf(doc as unknown as Record<string, unknown>)
  const status = typeof (doc as { status?: unknown }).status === 'string' ? (doc as { status: string }).status : ''
  const previousStatus =
    operation === 'update' && previousDoc && typeof (previousDoc as { status?: unknown }).status === 'string'
      ? (previousDoc as { status: string }).status
      : null

  await recordTierRequestStatusLog({
    req: req as PayloadRequest,
    doc: doc as Record<string, unknown>,
    previousStatus,
    status,
  })

  // Any status transition (or create as pending/rejected/approved) can change the
  // live ladder — including demotions when approved → pending/rejected. Sync is
  // idempotent when the latest audit already matches resolveCurrentTier.
  await syncTierChangedLog({
    payload: req.payload,
    req: req as PayloadRequest,
    userId,
    scopeId,
  })

  return doc
}
