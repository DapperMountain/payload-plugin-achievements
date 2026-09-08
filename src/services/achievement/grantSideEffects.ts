import type { PayloadRequest, Where } from 'payload'

import { collectionOf } from '../../collections/helpers'
import { CTX_CASCADING_REVOKE, CTX_SYSTEM_REQUEST } from './contextFlags'
import { evaluateRules, ruleGroupHasProgressRequirements } from './evaluateRules'
import { recordLog, syncTierChangedLog } from './recordEvent'
import { relationId } from './relationId'
import { syncTierProgression } from './tierProgression'
import { userScopeWhere } from './where'

export { CTX_CASCADING_REVOKE, CTX_SKIP_GRANT_SIDE_EFFECTS, CTX_SYSTEM_REQUEST } from './contextFlags'

type AchievementDef = {
  id: string
  slug?: string
  requiresReview?: boolean
  completionRules?: unknown
}

/** Create a grant row only — side effects run in Grants afterChange. */
export async function createGrantRow(args: {
  req: PayloadRequest
  userId: string
  achievementId: string
  scopeId?: string | null
  note?: string | null
  completedAt?: string
}): Promise<Record<string, unknown>> {
  const scopeId = args.scopeId ?? null
  const clauses: Where[] = [
    { user: { equals: args.userId } },
    { achievement: { equals: args.achievementId } },
  ]
  if (scopeId) clauses.push({ scope: { equals: scopeId } })
  else clauses.push({ scope: { exists: false } })

  const existing = await args.req.payload.find({
    collection: collectionOf('grants'),
    depth: 0,
    limit: 1,
    overrideAccess: true,
    req: args.req,
    where: { and: clauses },
  })
  if (existing.docs[0]) return existing.docs[0] as Record<string, unknown>

  return (await args.req.payload.create({
    collection: collectionOf('grants'),
    data: {
      user: args.userId,
      scope: scopeId ?? undefined,
      achievement: args.achievementId,
      completedAt: args.completedAt ?? new Date().toISOString(),
      ...(args.note ? { note: args.note } : {}),
    },
    overrideAccess: true,
    req: args.req,
  })) as Record<string, unknown>
}

/** Ensure a pending achievement request exists (system / reconcile path). */
export async function ensureAchievementRequest(args: {
  req: PayloadRequest
  userId: string
  achievementId: string
  scopeId?: string | null
}): Promise<{ doc: Record<string, unknown>; created: boolean }> {
  const scopeId = args.scopeId ?? null
  const clauses: Where[] = [
    { user: { equals: args.userId } },
    { achievement: { equals: args.achievementId } },
    { status: { in: ['pending', 'approved'] } },
  ]
  if (scopeId) clauses.push({ scope: { equals: scopeId } })
  else clauses.push({ scope: { exists: false } })

  const existing = await args.req.payload.find({
    collection: collectionOf('achievementRequests'),
    depth: 0,
    limit: 1,
    overrideAccess: true,
    req: args.req,
    where: { and: clauses },
  })
  if (existing.docs[0]) {
    return { doc: existing.docs[0] as Record<string, unknown>, created: false }
  }

  args.req.context[CTX_SYSTEM_REQUEST] = true
  try {
    const doc = (await args.req.payload.create({
      collection: collectionOf('achievementRequests'),
      data: {
        user: args.userId,
        scope: scopeId ?? undefined,
        achievement: args.achievementId,
        status: 'pending',
      },
      overrideAccess: true,
      req: args.req,
    })) as Record<string, unknown>
    return { doc, created: true }
  } finally {
    delete args.req.context[CTX_SYSTEM_REQUEST]
  }
}

/**
 * Auto-grant or open a request for composed achievements whose completion rules pass.
 */
export async function syncCompositeProgression(args: {
  req: PayloadRequest
  userId: string
  scopeId: string | null
}): Promise<{ granted: number; requested: number }> {
  const where = args.scopeId
    ? { or: [{ scope: { equals: args.scopeId } }, { scope: { exists: false } }] }
    : undefined

  const catalog = await args.req.payload.find({
    collection: collectionOf('achievements'),
    depth: 0,
    limit: 500,
    pagination: false,
    overrideAccess: true,
    req: args.req,
    ...(where ? { where } : {}),
  })

  let granted = 0
  let requested = 0

  for (const doc of catalog.docs) {
    const def = doc as AchievementDef
    if (!ruleGroupHasProgressRequirements(def.completionRules as never)) continue

    const complete = await evaluateRules({
      payload: args.req.payload,
      req: args.req,
      rules: def.completionRules as never,
      userId: args.userId,
      scopeId: args.scopeId,
    })
    if (!complete) continue

    if (def.requiresReview !== false) {
      const { created } = await ensureAchievementRequest({
        req: args.req,
        userId: args.userId,
        achievementId: String(def.id),
        scopeId: args.scopeId,
      })
      if (created) requested += 1
      continue
    }

    const before = await args.req.payload.find({
      collection: collectionOf('grants'),
      depth: 0,
      limit: 1,
      overrideAccess: true,
      req: args.req,
      where: {
        and: [
          { user: { equals: args.userId } },
          { achievement: { equals: String(def.id) } },
          ...(args.scopeId
            ? [{ scope: { equals: args.scopeId } } as Where]
            : [{ scope: { exists: false } } as Where]),
        ],
      },
    })
    if (before.docs[0]) continue

    await createGrantRow({
      req: args.req,
      userId: args.userId,
      achievementId: String(def.id),
      scopeId: args.scopeId,
    })
    granted += 1
  }

  return { granted, requested }
}

/** Delete grants for composed achievements that no longer pass completion rules. */
export async function revokeIncompleteComposites(args: {
  req: PayloadRequest
  userId: string
  scopeId: string | null
}): Promise<number> {
  const grants = await args.req.payload.find({
    collection: collectionOf('grants'),
    depth: 0,
    limit: 500,
    pagination: false,
    overrideAccess: true,
    req: args.req,
    where: userScopeWhere(args.userId, args.scopeId),
  })

  let revoked = 0
  for (const grant of grants.docs) {
    const achievementId = relationId((grant as { achievement?: unknown }).achievement)
    if (!achievementId) continue

    const def = (await args.req.payload.findByID({
      collection: collectionOf('achievements'),
      id: achievementId,
      depth: 0,
      overrideAccess: true,
      req: args.req,
    })) as AchievementDef | null
    if (!def || !ruleGroupHasProgressRequirements(def.completionRules as never)) continue

    const complete = await evaluateRules({
      payload: args.req.payload,
      req: args.req,
      rules: def.completionRules as never,
      userId: args.userId,
      scopeId: args.scopeId,
    })
    if (complete) continue

    args.req.context[CTX_CASCADING_REVOKE] = true
    try {
      await args.req.payload.delete({
        collection: collectionOf('grants'),
        id: String((grant as { id: string }).id),
        overrideAccess: true,
        req: args.req,
      })
      revoked += 1
    } finally {
      delete args.req.context[CTX_CASCADING_REVOKE]
    }
  }

  return revoked
}

export async function runAfterGrantCreated(args: {
  req: PayloadRequest
  userId: string
  achievementId: string
  scopeId: string | null
  achievementSlug?: string
}): Promise<void> {
  await recordLog({
    payload: args.req.payload,
    req: args.req,
    userId: args.userId,
    scopeId: args.scopeId,
    type: 'achievement.granted',
    data: {
      achievement: args.achievementId,
      ...(args.achievementSlug ? { achievementSlug: args.achievementSlug } : {}),
    },
  })

  await syncCompositeProgression({
    req: args.req,
    userId: args.userId,
    scopeId: args.scopeId,
  })

  await syncTierProgression({
    req: args.req,
    userId: args.userId,
    scopeId: args.scopeId,
  })

  await syncTierChangedLog({
    payload: args.req.payload,
    req: args.req,
    userId: args.userId,
    scopeId: args.scopeId,
  })
}

export async function runAfterGrantDeleted(args: {
  req: PayloadRequest
  userId: string
  achievementId: string
  scopeId: string | null
  achievementSlug?: string
  cascading?: boolean
}): Promise<void> {
  await recordLog({
    payload: args.req.payload,
    req: args.req,
    userId: args.userId,
    scopeId: args.scopeId,
    type: 'achievement.revoked',
    data: {
      achievement: args.achievementId,
      ...(args.achievementSlug ? { achievementSlug: args.achievementSlug } : {}),
    },
  })

  if (args.cascading) return

  await revokeIncompleteComposites({
    req: args.req,
    userId: args.userId,
    scopeId: args.scopeId,
  })

  await syncCompositeProgression({
    req: args.req,
    userId: args.userId,
    scopeId: args.scopeId,
  })

  await syncTierProgression({
    req: args.req,
    userId: args.userId,
    scopeId: args.scopeId,
  })

  await syncTierChangedLog({
    payload: args.req.payload,
    req: args.req,
    userId: args.userId,
    scopeId: args.scopeId,
  })
}
