import type { Payload, PayloadRequest, Where } from 'payload'

import { collectionOf } from '../../collections/helpers.js'
import {
  syncCompositeProgression,
} from './grantSideEffects.js'
import { transitionLogData, transitionToId } from './logData.js'
import { recordLog, syncTierChangedLog } from './recordEvent.js'
import { rebuildMetricBalancesForUser } from './metricBalances.js'
import { relationId } from './relationId.js'
import { resolveCatalogId } from './resolveCatalog.js'
import { syncTierProgression } from './tierProgression.js'
import { userScopeWhere } from './where.js'

export type ReconcileProgressionResult = {
  usersScanned: number
  grantedLogsBackfilled: number
  compositesGranted: number
  achievementRequestsEnsured: number
  tierRequestsEnsured: number
  tierLogsWritten: number
  metricBalancesRebuilt: number
}

export type ReconcileProgressionArgs = {
  payload: Payload
  req?: PayloadRequest
  /** Limit to one member. */
  userId?: string | null
  scopeId?: string | null
  /** Limit discovery to grants / requests for this achievement (id or slug). */
  achievementId?: string | null
  achievementSlug?: string | null
  /** Limit discovery to tier requests for this tier (id or slug). */
  tierId?: string | null
  tierSlug?: string | null
  limit?: number
}

type UserScopePair = { userId: string; scopeId: string | null }

async function backfillGrantedLogs(args: {
  req: PayloadRequest
  userId: string
  scopeId: string | null
}): Promise<number> {
  const typeId = await resolveCatalogId({
    payload: args.req.payload,
    req: args.req,
    key: 'eventTypes',
    slugOrId: 'achievement.granted',
  })

  const grants = await args.req.payload.find({
    collection: collectionOf('grants'),
    depth: 0,
    limit: 500,
    pagination: false,
    overrideAccess: true,
    req: args.req,
    where: userScopeWhere(args.userId, args.scopeId),
  })

  const logs = await args.req.payload.find({
    collection: collectionOf('logs'),
    depth: 0,
    limit: 500,
    pagination: false,
    overrideAccess: true,
    req: args.req,
    where: {
      and: [userScopeWhere(args.userId, args.scopeId), { type: { equals: typeId } }],
    },
  })

  const logged = new Set(
    logs.docs
      .map((log) => transitionToId((log as { data?: unknown }).data))
      .filter((id): id is string => Boolean(id)),
  )

  let written = 0
  for (const grant of grants.docs) {
    const achievementId = relationId((grant as { achievement?: unknown }).achievement)
    if (!achievementId || logged.has(achievementId)) continue

    let slug: string | undefined
    try {
      const def = (await args.req.payload.findByID({
        collection: collectionOf('achievements'),
        id: achievementId,
        depth: 0,
        overrideAccess: true,
        req: args.req,
        select: { slug: true },
      })) as { slug?: string } | null
      slug = def?.slug
    } catch {
      // ignore
    }

    const completedAt = (grant as { completedAt?: string }).completedAt

    await recordLog({
      payload: args.req.payload,
      req: args.req,
      userId: args.userId,
      scopeId: args.scopeId,
      type: 'achievement.granted',
      data: {
        ...transitionLogData({
          from: null,
          to: { id: achievementId, slug },
        }),
        ...(completedAt ? { completedAt } : {}),
        backfilled: true,
      },
    })
    logged.add(achievementId)
    written += 1
  }

  return written
}

/** Repair progression for one user (+ optional scope) from current grants + catalog. */
export async function reconcileUserProgression(args: {
  payload: Payload
  req?: PayloadRequest
  userId: string
  scopeId?: string | null
}): Promise<Omit<ReconcileProgressionResult, 'usersScanned'>> {
  const scopeId = args.scopeId ?? null
  const req =
    args.req ??
    ({
      payload: args.payload,
      context: {},
    } as PayloadRequest)

  if (!req.context) (req as { context: Record<string, unknown> }).context = {}

  const grantedLogsBackfilled = await backfillGrantedLogs({ req, userId: args.userId, scopeId })
  const metricBalancesRebuilt = await rebuildMetricBalancesForUser({
    payload: args.payload,
    req,
    userId: args.userId,
    scopeId,
  })
  const composites = await syncCompositeProgression({
    req,
    userId: args.userId,
    scopeId,
  })
  const tiers = await syncTierProgression({
    req,
    userId: args.userId,
    scopeId,
  })
  const tierLog = await syncTierChangedLog({
    payload: args.payload,
    req,
    userId: args.userId,
    scopeId,
  })

  return {
    grantedLogsBackfilled,
    metricBalancesRebuilt,
    compositesGranted: composites.granted,
    achievementRequestsEnsured: composites.requested,
    tierRequestsEnsured: tiers.requested,
    tierLogsWritten: tierLog ? 1 : 0,
  }
}

function scopeKey(scope: unknown): string {
  const id = relationId(scope)
  return id ?? ''
}

function addPair(
  pairs: Map<string, UserScopePair>,
  userId: string | null,
  scopeId: string | null,
  filterUserId?: string | null,
  filterScopeId?: string | null,
): void {
  if (!userId) return
  if (filterUserId && userId !== filterUserId) return
  if (filterScopeId != null && filterScopeId !== '' && scopeId !== filterScopeId) return
  const key = `${userId}::${scopeKey(scopeId)}`
  if (!pairs.has(key)) pairs.set(key, { userId, scopeId })
}

async function resolveDefinitionId(args: {
  payload: Payload
  req: PayloadRequest
  collection: 'achievements' | 'tiers'
  id?: string | null
  slug?: string | null
}): Promise<string | null> {
  if (args.id && args.id.length > 0) return args.id
  if (!args.slug || args.slug.length === 0) return null
  const found = await args.payload.find({
    collection: collectionOf(args.collection),
    depth: 0,
    limit: 1,
    overrideAccess: true,
    req: args.req,
    where: { slug: { equals: args.slug } },
  })
  return relationId(found.docs[0]?.id) ?? null
}

async function collectPairs(args: {
  payload: Payload
  req: PayloadRequest
  userId?: string | null
  scopeId?: string | null
  achievementId?: string | null
  achievementSlug?: string | null
  tierId?: string | null
  tierSlug?: string | null
  limit: number
}): Promise<UserScopePair[]> {
  const pairs = new Map<string, UserScopePair>()
  const filterUserId = args.userId?.trim() || null
  const filterScopeId = args.scopeId ?? null

  const achievementId = await resolveDefinitionId({
    payload: args.payload,
    req: args.req,
    collection: 'achievements',
    id: args.achievementId,
    slug: args.achievementSlug,
  })
  const tierId = await resolveDefinitionId({
    payload: args.payload,
    req: args.req,
    collection: 'tiers',
    id: args.tierId,
    slug: args.tierSlug,
  })

  if (filterUserId && !achievementId && !tierId) {
    addPair(pairs, filterUserId, filterScopeId)
    return [...pairs.values()]
  }

  if (achievementId) {
    const grantWhere: Where = {
      and: [
        { achievement: { equals: achievementId } },
        ...(filterUserId ? [{ user: { equals: filterUserId } }] : []),
        ...(filterScopeId
          ? [{ scope: { equals: filterScopeId } }]
          : []),
      ],
    }
    const grants = await args.payload.find({
      collection: collectionOf('grants'),
      depth: 0,
      limit: args.limit,
      pagination: false,
      overrideAccess: true,
      req: args.req,
      where: grantWhere,
    })
    for (const grant of grants.docs) {
      addPair(
        pairs,
        relationId((grant as { user?: unknown }).user),
        relationId((grant as { scope?: unknown }).scope),
        filterUserId,
        filterScopeId,
      )
    }

    const requestWhere: Where = {
      and: [
        { achievement: { equals: achievementId } },
        ...(filterUserId ? [{ user: { equals: filterUserId } }] : []),
        ...(filterScopeId ? [{ scope: { equals: filterScopeId } }] : []),
      ],
    }
    const requests = await args.payload.find({
      collection: collectionOf('achievementRequests'),
      depth: 0,
      limit: args.limit,
      pagination: false,
      overrideAccess: true,
      req: args.req,
      where: requestWhere,
    })
    for (const request of requests.docs) {
      addPair(
        pairs,
        relationId((request as { user?: unknown }).user),
        relationId((request as { scope?: unknown }).scope),
        filterUserId,
        filterScopeId,
      )
    }
  }

  if (tierId) {
    const requestWhere: Where = {
      and: [
        { tier: { equals: tierId } },
        ...(filterUserId ? [{ user: { equals: filterUserId } }] : []),
        ...(filterScopeId ? [{ scope: { equals: filterScopeId } }] : []),
      ],
    }
    const requests = await args.payload.find({
      collection: collectionOf('tierRequests'),
      depth: 0,
      limit: args.limit,
      pagination: false,
      overrideAccess: true,
      req: args.req,
      where: requestWhere,
    })
    for (const request of requests.docs) {
      addPair(
        pairs,
        relationId((request as { user?: unknown }).user),
        relationId((request as { scope?: unknown }).scope),
        filterUserId,
        filterScopeId,
      )
    }
  }

  if (!achievementId && !tierId) {
    const where: Where | undefined = filterScopeId
      ? { scope: { equals: filterScopeId } }
      : undefined
    const grants = await args.payload.find({
      collection: collectionOf('grants'),
      depth: 0,
      limit: args.limit,
      pagination: false,
      overrideAccess: true,
      req: args.req,
      ...(where ? { where } : {}),
    })
    for (const grant of grants.docs) {
      addPair(
        pairs,
        relationId((grant as { user?: unknown }).user),
        relationId((grant as { scope?: unknown }).scope),
        filterUserId,
        filterScopeId,
      )
    }
  }

  return [...pairs.values()]
}

/**
 * Scan matching (user, scope) pairs and repair progression.
 * Optional filters: `userId`, `scopeId`, `achievementId`/`achievementSlug`, `tierId`/`tierSlug`.
 */
export async function reconcileProgression(
  args: ReconcileProgressionArgs,
): Promise<ReconcileProgressionResult> {
  const req =
    args.req ??
    ({
      payload: args.payload,
      context: {},
    } as PayloadRequest)
  if (!req.context) (req as { context: Record<string, unknown> }).context = {}

  const pairs = await collectPairs({
    payload: args.payload,
    req,
    userId: args.userId,
    scopeId: args.scopeId,
    achievementId: args.achievementId,
    achievementSlug: args.achievementSlug,
    tierId: args.tierId,
    tierSlug: args.tierSlug,
    limit: args.limit ?? 5000,
  })

  const totals: ReconcileProgressionResult = {
    usersScanned: 0,
    grantedLogsBackfilled: 0,
    compositesGranted: 0,
    achievementRequestsEnsured: 0,
    tierRequestsEnsured: 0,
    tierLogsWritten: 0,
    metricBalancesRebuilt: 0,
  }

  for (const pair of pairs) {
    const result = await reconcileUserProgression({
      payload: args.payload,
      req,
      userId: pair.userId,
      scopeId: pair.scopeId,
    })
    totals.usersScanned += 1
    totals.grantedLogsBackfilled += result.grantedLogsBackfilled
    totals.compositesGranted += result.compositesGranted
    totals.achievementRequestsEnsured += result.achievementRequestsEnsured
    totals.tierRequestsEnsured += result.tierRequestsEnsured
    totals.tierLogsWritten += result.tierLogsWritten
    totals.metricBalancesRebuilt += result.metricBalancesRebuilt
  }

  return totals
}
