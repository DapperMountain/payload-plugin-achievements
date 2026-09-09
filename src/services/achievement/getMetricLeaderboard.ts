import type { Payload, PayloadRequest, Where } from 'payload'
import { APIError } from 'payload'

import { collectionOf } from '../../collections/helpers.js'
import { getAchievementOptions } from '../../options-store.js'
import { loadMetricDoc } from './resolveMetricValue.js'
import { relationId } from './relationId.js'

export type MetricLeaderboardRow = {
  user: string
  value: number
  rank: number
}

export type MetricLeaderboardResult = {
  docs: MetricLeaderboardRow[]
  totalDocs: number
  page: number
  limit: number
  totalPages: number
  metric: { id: string; slug?: string }
  scopeId: string | null
}

/**
 * Ranked stored-metric balances for a scope (or unscoped board when `scopeId` is null).
 */
export async function getMetricLeaderboard(args: {
  payload: Payload
  req?: PayloadRequest
  metric: string
  scopeId?: string | null
  limit?: number
  page?: number
}): Promise<MetricLeaderboardResult> {
  const metric = await loadMetricDoc({
    payload: args.payload,
    req: args.req,
    metric: args.metric,
  })
  if (!metric) {
    throw new APIError('Metric not found.', 404)
  }
  if ((metric.kind ?? 'stored') === 'computed') {
    throw new APIError('Leaderboards are only available for stored metrics.', 400)
  }

  const limit = Math.min(Math.max(args.limit ?? 20, 1), 100)
  const page = Math.max(args.page ?? 1, 1)
  const scopeId = args.scopeId ?? null
  const scopeConfigured = Boolean(getAchievementOptions().scope?.collection)

  const clauses: Where[] = [{ metric: { equals: metric.id } }]
  if (scopeId) {
    clauses.push({ scope: { equals: scopeId } })
  } else if (scopeConfigured) {
    clauses.push({
      or: [{ scope: { exists: false } }, { scope: { equals: null } }],
    })
  }

  const result = await args.payload.find({
    collection: collectionOf('metricBalances'),
    depth: 0,
    limit,
    page,
    overrideAccess: true,
    req: args.req,
    sort: '-value,id',
    where: { and: clauses },
  })

  const offset = (page - 1) * limit
  const docs: MetricLeaderboardRow[] = result.docs.map((doc, index) => {
    const row = doc as { user?: unknown; value?: unknown }
    return {
      user: relationId(row.user) ?? String(row.user ?? ''),
      value: typeof row.value === 'number' && Number.isFinite(row.value) ? row.value : 0,
      rank: offset + index + 1,
    }
  })

  return {
    docs,
    totalDocs: result.totalDocs,
    page: result.page ?? page,
    limit,
    totalPages: result.totalPages ?? Math.max(1, Math.ceil(result.totalDocs / limit)),
    metric: { id: metric.id, slug: metric.slug },
    scopeId,
  }
}
