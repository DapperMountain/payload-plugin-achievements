import type { Payload, PayloadRequest } from 'payload'
import { APIError } from 'payload'

import { DEFAULT_ACHIEVEMENT_METRIC_SLUG } from '../../catalog.js'
import { collectionOf } from '../../collections/helpers.js'
import { eventTypeRequiresActor } from './eventTypeRequiresActor.js'
import { transitionLogData, transitionToId } from './logData.js'
import { resolveCatalogId } from './resolveCatalog.js'
import { resolveCurrentTier } from './resolveCurrentTier.js'
import { userScopeWhere } from './where.js'

export type RecordLogInput = {
  payload: Payload
  req?: PayloadRequest
  userId: string
  scopeId?: string | null
  /** Log-type catalog slug (preferred) or document id. */
  type: string
  actorId?: string | null
  /** Metric catalog slug (preferred) or document id. */
  metric?: string
  /** Signed amount the metric moved (for metric.delta logs). */
  change?: number
  reason?: string
  data?: Record<string, unknown> | null
}

async function catalogId(args: {
  payload: Payload
  req?: PayloadRequest
  key: 'eventTypes' | 'metrics'
  value: string
}): Promise<string> {
  return resolveCatalogId({
    payload: args.payload,
    req: args.req,
    key: args.key,
    slugOrId: args.value,
  })
}

/** Append a catalogued occurrence to the achievement log. */
export async function recordLog(args: RecordLogInput) {
  const scopeId = args.scopeId ?? null
  const typeId = await catalogId({
    payload: args.payload,
    req: args.req,
    key: 'eventTypes',
    value: args.type,
  })

  const metricId = args.metric
    ? await catalogId({
        payload: args.payload,
        req: args.req,
        key: 'metrics',
        value: args.metric,
      })
    : undefined

  if (await eventTypeRequiresActor({ payload: args.payload, req: args.req, typeIdOrDoc: typeId })) {
    if (!args.actorId) {
      throw new APIError('This log type needs an actor (who caused it).', 400)
    }
  }

  return args.payload.create({
    collection: collectionOf('logs'),
    data: {
      user: args.userId,
      scope: scopeId ?? undefined,
      type: typeId,
      actor: args.actorId ?? undefined,
      metric: metricId,
      change: args.change,
      reason: args.reason,
      data: args.data ?? undefined,
    },
    overrideAccess: true,
    req: args.req,
  })
}

/** @deprecated Prefer {@link recordLog}. */
export const recordEvent = recordLog

/**
 * Record `metric.delta`, then sync an optional `tier.changed` audit log.
 */
export async function recordMetricChange(args: {
  payload: Payload
  req?: PayloadRequest
  userId: string
  scopeId?: string | null
  metric?: string
  change: number
  reason?: string
  actorId?: string | null
}) {
  const metricSlug = args.metric ?? DEFAULT_ACHIEVEMENT_METRIC_SLUG
  const scopeId = args.scopeId ?? null

  const log = await recordLog({
    payload: args.payload,
    req: args.req,
    userId: args.userId,
    scopeId,
    type: 'metric.delta',
    actorId: args.actorId,
    metric: metricSlug,
    change: args.change,
    reason: args.reason,
  })

  if (args.req) {
    const { syncTierProgression } = await import('./tierProgression.js')
    await syncTierProgression({
      req: args.req,
      userId: args.userId,
      scopeId,
    })
  }

  await syncTierChangedLog({
    payload: args.payload,
    req: args.req,
    userId: args.userId,
    scopeId,
  })

  return log
}

/** Write `tier.changed` when the ladder-derived tier differs from the latest audit entry. */
export async function syncTierChangedLog(args: {
  payload: Payload
  req?: PayloadRequest
  userId: string
  scopeId?: string | null
}) {
  const scopeId = args.scopeId ?? null
  const current = await resolveCurrentTier({
    payload: args.payload,
    req: args.req,
    userId: args.userId,
    scopeId,
  })

  const typeId = await catalogId({
    payload: args.payload,
    req: args.req,
    key: 'eventTypes',
    value: 'tier.changed',
  })

  const latest = await args.payload.find({
    collection: collectionOf('logs'),
    depth: 0,
    limit: 1,
    overrideAccess: true,
    req: args.req,
    sort: '-createdAt',
    where: {
      and: [userScopeWhere(args.userId, scopeId), { type: { equals: typeId } }],
    },
  })

  const latestData = (latest.docs[0] as { data?: unknown } | undefined)?.data
  const lastTierId = transitionToId(latestData)
  const currentId = current?.id ?? null

  if (lastTierId === currentId) return null
  if (!currentId) return null

  let fromSlug: string | undefined
  if (latestData && typeof latestData === 'object' && !Array.isArray(latestData)) {
    const record = latestData as Record<string, unknown>
    const to = record.to
    if (to && typeof to === 'object' && !Array.isArray(to)) {
      const slug = (to as { slug?: unknown }).slug
      if (typeof slug === 'string') fromSlug = slug
    } else if (typeof record.tierSlug === 'string') {
      fromSlug = record.tierSlug
    }
  }

  return recordLog({
    payload: args.payload,
    req: args.req,
    userId: args.userId,
    scopeId,
    type: 'tier.changed',
    data: transitionLogData({
      from: lastTierId ? { id: lastTierId, slug: fromSlug } : null,
      to: { id: currentId, slug: current?.slug },
    }),
  })
}
