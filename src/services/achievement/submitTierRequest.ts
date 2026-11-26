import type { PayloadRequest, Where } from 'payload'
import { APIError } from 'payload'

import { collectionOf } from '../../collections/helpers.js'

function tierRequestScopeClauses(scopeId: string | null): Where[] {
  if (scopeId) return [{ scope: { equals: scopeId } }]
  return [{ scope: { exists: false } }]
}

/**
 * Member (or trusted caller) opens a tier request when unlock rules pass and the
 * tier requires review. Idempotent while a pending request exists. Reopens the
 * latest rejected row instead of stacking duplicates.
 *
 * Unlock / requiresReview checks run in TierRequests `beforeValidate`.
 */
export async function submitTierRequest(args: {
  req: PayloadRequest
  userId: string
  tierId: string
  scopeId?: string | null
  note?: string
}): Promise<Record<string, unknown>> {
  const sessionUserId = typeof args.req.user?.id === 'string' ? args.req.user.id : null
  if (!sessionUserId) throw new APIError('Unauthorized', 401)
  // Find/reopen paths key off userId; refuse acting for someone else.
  if (args.userId !== sessionUserId) throw new APIError('Forbidden', 403)

  const scopeId = args.scopeId ?? null
  const base: Where[] = [
    { user: { equals: args.userId } },
    { tier: { equals: args.tierId } },
    ...tierRequestScopeClauses(scopeId),
  ]

  const open = await args.req.payload.find({
    collection: collectionOf('tierRequests'),
    depth: 0,
    limit: 1,
    overrideAccess: true,
    req: args.req,
    where: {
      and: [...base, { status: { in: ['pending', 'approved'] } }],
    },
  })
  const openDoc = open.docs[0] as Record<string, unknown> | undefined
  if (openDoc) {
    if (openDoc.status === 'approved') {
      throw new APIError('This tier request is already approved.', 400)
    }
    return openDoc
  }

  const rejected = await args.req.payload.find({
    collection: collectionOf('tierRequests'),
    depth: 0,
    limit: 1,
    overrideAccess: true,
    req: args.req,
    sort: '-updatedAt',
    where: {
      and: [...base, { status: { equals: 'rejected' } }],
    },
  })
  const rejectedDoc = rejected.docs[0] as { id?: string } | undefined
  if (rejectedDoc?.id) {
    // Access.update is reviewer-only; reopen as the requesting member via a trusted update.
    return (await args.req.payload.update({
      collection: collectionOf('tierRequests'),
      id: String(rejectedDoc.id),
      data: {
        status: 'pending',
        ...(args.note !== undefined ? { note: args.note } : {}),
      },
      overrideAccess: true,
      req: args.req,
      user: args.req.user,
    })) as Record<string, unknown>
  }

  return (await args.req.payload.create({
    collection: collectionOf('tierRequests'),
    data: {
      user: args.userId,
      scope: scopeId ?? undefined,
      tier: args.tierId,
      note: args.note,
      status: 'pending',
    },
    overrideAccess: false,
    req: args.req,
    user: args.req.user ?? undefined,
  })) as Record<string, unknown>
}
