import type { Payload, PayloadRequest } from 'payload'

import { collectionOf } from '../../collections/helpers.js'
import { getAchievementOptions } from '../../options-store.js'
import { parseDate } from './duration.js'
import { relationId } from './relationId.js'
import { userScopeIncludingUnscopedWhere } from './where.js'

async function resolveEventTypeId(args: {
  payload: Payload
  req?: PayloadRequest
  eventType: unknown
  eventTypeSlug?: unknown
}): Promise<string | null> {
  let eventTypeId = relationId(args.eventType)
  if (eventTypeId) {
    const byId = await args.payload.find({
      collection: collectionOf('eventTypes'),
      depth: 0,
      limit: 1,
      overrideAccess: true,
      req: args.req,
      where: { id: { equals: eventTypeId } },
    })
    if (byId.docs[0]) return eventTypeId
  }

  const slug =
    typeof args.eventTypeSlug === 'string'
      ? args.eventTypeSlug
      : typeof args.eventType === 'string'
        ? args.eventType
        : ''
  if (!slug) return null

  const found = await args.payload.find({
    collection: collectionOf('eventTypes'),
    depth: 0,
    limit: 1,
    overrideAccess: true,
    req: args.req,
    where: { slug: { equals: slug } },
  })
  return relationId(found.docs[0])
}

/**
 * Resolve the start timestamp for elapsed rules / computed metrics.
 * Built-ins: `user-created-at`, `first-event`. Host keys: `extensions.metricAnchors`.
 */
export async function resolveElapsedAnchor(args: {
  payload: Payload
  req?: PayloadRequest
  since?: unknown
  eventType?: unknown
  eventTypeSlug?: unknown
  userId: string
  scopeId: string | null
}): Promise<Date | null> {
  const since = String(args.since ?? 'user-created-at')

  if (since === 'user-created-at') {
    const usersSlug = getAchievementOptions().usersCollectionSlug ?? 'users'
    try {
      const user = (await args.payload.findByID({
        collection: usersSlug,
        id: args.userId,
        depth: 0,
        overrideAccess: true,
        req: args.req,
      })) as { createdAt?: unknown } | null
      return parseDate(user?.createdAt)
    } catch {
      return null
    }
  }

  if (since === 'first-event') {
    const eventTypeId = await resolveEventTypeId({
      payload: args.payload,
      req: args.req,
      eventType: args.eventType,
      eventTypeSlug: args.eventTypeSlug,
    })
    if (!eventTypeId) return null
    const logs = await args.payload.find({
      collection: collectionOf('logs'),
      depth: 0,
      limit: 1,
      overrideAccess: true,
      req: args.req,
      sort: 'createdAt',
      where: {
        and: [
          userScopeIncludingUnscopedWhere(args.userId, args.scopeId),
          { type: { equals: eventTypeId } },
        ],
      },
    })
    return parseDate((logs.docs[0] as { createdAt?: unknown } | undefined)?.createdAt)
  }

  const hostAnchor = getAchievementOptions().extensions?.metricAnchors?.[since]
  if (!hostAnchor) return null
  try {
    return parseDate(
      await hostAnchor({
        payload: args.payload,
        req: args.req,
        userId: args.userId,
        scopeId: args.scopeId,
      }),
    )
  } catch {
    return null
  }
}
