import type { PayloadRequest, Where } from 'payload'

import { collectionOf } from '../../collections/helpers'
import { evaluateRules, ruleGroupHasProgressRequirements } from './evaluateRules'
import { recordLog, syncTierChangedLog } from './recordEvent'

/**
 * Create an achievement request (or auto-approved grant) via the collection.
 * Hooks bind the requesting user, check eligibility, and grant when approved.
 */
export async function submitAchievementRequest(args: {
  req: PayloadRequest
  userId: string
  achievementId: string
  scopeId?: string | null
  note?: string
}) {
  return args.req.payload.create({
    collection: collectionOf('achievementRequests'),
    data: {
      // user is overwritten from req.user in beforeValidate
      user: args.userId,
      scope: args.scopeId ?? undefined,
      achievement: args.achievementId,
      note: args.note,
      status: 'pending',
    },
    overrideAccess: false,
    req: args.req,
    user: args.req.user ?? undefined,
  })
}

/** Create a grant row, emit achievement.granted, sync tier.changed when the ladder moves. */
export async function grantAchievement(args: {
  req: PayloadRequest
  userId: string
  achievementId: string
  scopeId?: string | null
  note?: string | null
}) {
  const scopeId = args.scopeId ?? null
  const achievementId = args.achievementId

  const definition = (await args.req.payload.findByID({
    collection: collectionOf('achievements'),
    id: achievementId,
    depth: 0,
    overrideAccess: true,
    req: args.req,
  })) as { slug?: string } | null

  const clauses: Where[] = [
    { user: { equals: args.userId } },
    { achievement: { equals: achievementId } },
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

  if (existing.docs[0]) return existing.docs[0]

  const result = await args.req.payload.create({
    collection: collectionOf('grants'),
    data: {
      user: args.userId,
      scope: scopeId ?? undefined,
      achievement: achievementId,
      completedAt: new Date().toISOString(),
      ...(args.note ? { note: args.note } : {}),
    },
    overrideAccess: true,
    req: args.req,
  })

  await recordLog({
    payload: args.req.payload,
    req: args.req,
    userId: args.userId,
    scopeId,
    type: 'achievement.granted',
    data: {
      achievement: achievementId,
      ...(definition?.slug ? { achievementSlug: definition.slug } : {}),
    },
  })

  await syncCompositeGrants({
    req: args.req,
    userId: args.userId,
    scopeId,
  })

  await syncTierChangedLog({
    payload: args.req.payload,
    req: args.req,
    userId: args.userId,
    scopeId,
  })

  return result
}

async function syncCompositeGrants(args: {
  req: PayloadRequest
  userId: string
  scopeId: string | null
}): Promise<void> {
  const where = args.scopeId
    ? { or: [{ scope: { equals: args.scopeId } }, { scope: { exists: false } }] }
    : undefined

  const catalog = await args.req.payload.find({
    collection: collectionOf('achievements'),
    depth: 0,
    limit: 200,
    pagination: false,
    overrideAccess: true,
    req: args.req,
    ...(where ? { where } : {}),
  })

  for (const doc of catalog.docs) {
    const def = doc as {
      id: string
      requiresReview?: boolean
      completionRules?: unknown
    }
    if (def.requiresReview !== false) continue
    if (!ruleGroupHasProgressRequirements(def.completionRules as never)) continue
    if (String(def.id) === '') continue

    const complete = await evaluateRules({
      payload: args.req.payload,
      req: args.req,
      rules: def.completionRules as never,
      userId: args.userId,
      scopeId: args.scopeId,
    })
    if (!complete) continue

    await grantAchievement({
      req: args.req,
      userId: args.userId,
      achievementId: String(def.id),
      scopeId: args.scopeId,
    })
  }
}
