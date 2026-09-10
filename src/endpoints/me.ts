import type { Endpoint, PayloadRequest } from 'payload'

import { getUserId } from '../access/helpers/index.js'
import { getUserProgress } from '../services/achievement/getUserProgress.js'

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

function pagingFromRequest(req: PayloadRequest) {
  const params = requestUrl(req)?.searchParams
  return {
    limit: positiveInt(params?.get('limit') ?? null, 10),
    page: positiveInt(params?.get('page') ?? null, 1),
    requestsLimit: positiveInt(params?.get('requestsLimit') ?? null, 20),
  }
}

function reviewsFromRequest(req: PayloadRequest): boolean {
  const raw = requestUrl(req)?.searchParams.get('reviews')
  return raw === '1' || raw === 'true'
}

/**
 * `GET` current user’s snapshot. Body is Payload `find`-shaped for **grants**,
 * plus ladder-derived `tiers` and lean `requests`. Optional `?scope=` / `limit` / `page`
 * / `reviews=1` (pending achievement keys + open/rejected tier requests).
 */
export function buildMeEndpoint(path: string): Endpoint {
  return {
    path,
    method: 'get',
    handler: async (req) => {
      const userId = getUserId(req)
      if (!userId) {
        return Response.json({ errors: [{ message: 'Unauthorized' }] }, { status: 401 })
      }

      const body = await getUserProgress({
        payload: req.payload,
        req,
        userId,
        scopeId: scopeFromRequest(req),
        paging: pagingFromRequest(req),
        include: reviewsFromRequest(req) ? { reviews: true } : undefined,
      })

      return Response.json(body)
    },
  }
}
