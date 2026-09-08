import type { Endpoint, PayloadRequest } from 'payload'

import { getUserId } from '../access/helpers/index'
import { getAchievementOptions } from '../options-store'
import { reconcileProgression, reconcileUserProgression } from '../services/achievement/reconcile'

function requestUrl(req: PayloadRequest): URL | null {
  return req.url ? new URL(req.url, 'http://local') : null
}

async function readBody(req: PayloadRequest): Promise<Record<string, unknown>> {
  try {
    if (typeof req.json === 'function') {
      const body = await req.json()
      if (body && typeof body === 'object') return body as Record<string, unknown>
    }
  } catch {
    // empty body
  }
  return {}
}

/**
 * `POST` repair progression from existing grants.
 * Body (optional): `{ userId?, scopeId?, limit? }`.
 * Requires host `canReview`.
 */
export function buildReconcileEndpoint(path: string): Endpoint {
  return {
    path,
    method: 'post',
    handler: async (req) => {
      const actorId = getUserId(req)
      if (!actorId || !req.user) {
        return Response.json({ errors: [{ message: 'Unauthorized' }] }, { status: 401 })
      }

      const { canReview } = getAchievementOptions()
      if (!canReview) {
        return Response.json({ errors: [{ message: 'Forbidden' }] }, { status: 403 })
      }

      const body = await readBody(req)
      const url = requestUrl(req)
      const scopeIdRaw =
        (typeof body.scopeId === 'string' && body.scopeId) ||
        url?.searchParams.get('scopeId') ||
        url?.searchParams.get('scope') ||
        null
      const scopeId = scopeIdRaw && scopeIdRaw.length > 0 ? scopeIdRaw : null

      if (!(await canReview(req.user, scopeId))) {
        return Response.json({ errors: [{ message: 'Forbidden' }] }, { status: 403 })
      }

      const userId =
        typeof body.userId === 'string' && body.userId.length > 0 ? body.userId : null
      const limit =
        typeof body.limit === 'number' && Number.isFinite(body.limit)
          ? Math.floor(body.limit)
          : undefined

      if (userId) {
        const result = await reconcileUserProgression({
          payload: req.payload,
          req,
          userId,
          scopeId,
        })
        return Response.json({ ok: true, usersScanned: 1, ...result })
      }

      const result = await reconcileProgression({
        payload: req.payload,
        req,
        scopeId,
        limit,
      })
      return Response.json({ ok: true, ...result })
    },
  }
}
