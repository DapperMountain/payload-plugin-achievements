import type { Payload, PayloadRequest } from 'payload'
import { APIError } from 'payload'

import { collectionOf } from '../../collections/helpers'
import type { AchievementCollectionKey } from '../../types'

type CatalogKey = Extract<AchievementCollectionKey, 'eventTypes' | 'metrics'>

/**
 * Resolve a catalog relationship from a slug or document id.
 */
export async function resolveCatalogId(args: {
  payload: Payload
  req?: PayloadRequest
  key: CatalogKey
  slugOrId: string
}): Promise<string> {
  const collection = collectionOf(args.key)
  const bySlug = await args.payload.find({
    collection,
    depth: 0,
    limit: 1,
    overrideAccess: true,
    req: args.req,
    where: { slug: { equals: args.slugOrId } },
  })
  const slugId = (bySlug.docs[0] as { id?: string } | undefined)?.id
  if (typeof slugId === 'string') return slugId

  try {
    const byId = (await args.payload.findByID({
      collection,
      id: args.slugOrId,
      depth: 0,
      overrideAccess: true,
      req: args.req,
    })) as { id?: string } | null
    if (typeof byId?.id === 'string') return byId.id
  } catch {
    // Not a document id either.
  }

  throw new APIError(`Unknown ${args.key}: ${args.slugOrId}`, 400)
}
