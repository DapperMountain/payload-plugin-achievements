import type { PayloadRequest, Where } from 'payload'

import { collectionOf } from '../../collections/helpers.js'

export async function hasApprovedTierRequest(args: {
  req: PayloadRequest
  userId: string
  tierId: string
  scopeId: string | null
}): Promise<boolean> {
  const clauses: Where[] = [
    { user: { equals: args.userId } },
    { tier: { equals: args.tierId } },
    { status: { equals: 'approved' } },
  ]
  if (args.scopeId) clauses.push({ scope: { equals: args.scopeId } })
  else clauses.push({ scope: { exists: false } })

  const existing = await args.req.payload.find({
    collection: collectionOf('tierRequests'),
    depth: 0,
    limit: 1,
    overrideAccess: true,
    req: args.req,
    where: { and: clauses },
  })
  return Boolean(existing.docs[0])
}
