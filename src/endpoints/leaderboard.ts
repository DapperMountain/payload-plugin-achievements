import type { Endpoint, PayloadRequest } from 'payload'

import { getUserId } from '../access/helpers/index.js'
import { getMetricLeaderboard } from '../services/achievement/getMetricLeaderboard.js'

function requestUrl(req: PayloadRequest): URL | null {
  return req.url ? new URL(req.url, 'http://local') : null
}

function scopeFromRequest(req: PayloadRequest): string | null {
  const url = requestUrl(req)
  const raw = url?.searchParams.get('scope') ?? url?.searchParams.get('scopeId')
  return raw && raw.length > 0 ? raw : null
}

function positiveInt(raw: string | null, fallback: number): number {
  if (raw == null || raw === '') return fallback
  const n = Number(raw)
  if (!Number.isFinite(n) || n < 1) return fallback
  return Math.floor(n)
}

/**
 * `GET` ranked stored-metric balances. Query: `metric` (required), optional `scope` / `limit` / `page`.
 */
export function buildLeaderboardEndpoint(path: string): Endpoint {
  return {
    path,
    method: 'get',
    handler: async (req) => {
      const userId = getUserId(req)
      if (!userId) {
        return Response.json({ errors: [{ message: 'Unauthorized' }] }, { status: 401 })
      }

      const params = requestUrl(req)?.searchParams
      const metric = params?.get('metric')?.trim()
      if (!metric) {
        return Response.json({ errors: [{ message: 'Query param `metric` is required.' }] }, { status: 400 })
      }

      try {
        const body = await getMetricLeaderboard({
          payload: req.payload,
          req,
          metric,
          scopeId: scopeFromRequest(req),
          limit: positiveInt(params?.get('limit') ?? null, 20),
          page: positiveInt(params?.get('page') ?? null, 1),
        })
        return Response.json(body)
      } catch (error) {
        const status =
          typeof error === 'object' &&
          error &&
          'status' in error &&
          typeof (error as { status?: unknown }).status === 'number'
            ? (error as { status: number }).status
            : 500
        const message = error instanceof Error ? error.message : 'Leaderboard failed.'
        return Response.json({ errors: [{ message }] }, { status })
      }
    },
  }
}
