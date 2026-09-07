import type {
  CollectionAfterChangeHook,
  CollectionBeforeValidateHook,
  PayloadRequest,
} from 'payload'
import { APIError } from 'payload'

import { collectionOf } from '../../../collections/helpers'
import { evaluateRules, ruleGroupHasProgressRequirements, type RuleGroup } from '../../../services/achievement/evaluateRules'
import { grantAchievement } from '../../../services/achievement/submitAchievementRequest'
import { relationId } from '../../../services/achievement/relationId'

type AchievementDoc = {
  id: string
  slug?: string
  eligibilityRules?: RuleGroup | Record<string, unknown>[]
  completionRules?: RuleGroup | Record<string, unknown>[]
  requiresReview?: boolean
}

function scopeIdOf(data: Record<string, unknown> | undefined): string | null {
  const scope = data?.scope
  if (!scope) return null
  return relationId(scope)
}

async function resolveAchievement(args: {
  req: PayloadRequest
  data: Record<string, unknown>
}): Promise<AchievementDoc> {
  const achievementId = relationId(args.data.achievement)
  if (!achievementId) {
    throw new APIError('achievement required', 400)
  }

  const doc = (await args.req.payload.findByID({
    collection: collectionOf('achievements'),
    id: achievementId,
    depth: 0,
    overrideAccess: true,
    req: args.req,
  })) as AchievementDoc | null
  if (!doc) throw new APIError(`Unknown achievement: ${achievementId}`, 400)
  return doc
}

/**
 * Create: bind the requesting user, enforce eligibility,
 * auto-approve when the definition does not require review.
 * Update: status transitions handled in afterChange.
 */
export const prepareAchievementRequest: CollectionBeforeValidateHook = async ({
  data,
  operation,
  req,
  originalDoc,
}) => {
  if (!data) return data

  if (operation === 'create') {
    const userId = req.user?.id
    if (typeof userId !== 'string') throw new APIError('Unauthorized', 401)

    data.user = userId

    const scopeId = scopeIdOf(data as Record<string, unknown>)
    const achievement = await resolveAchievement({
      req,
      data: data as Record<string, unknown>,
    })

    data.achievement = achievement.id

    if (ruleGroupHasProgressRequirements(achievement.completionRules as never)) {
      throw new APIError(
        'This achievement is granted automatically when its completion rules pass.',
        400,
      )
    }

    const eligible = await evaluateRules({
      payload: req.payload,
      req,
      rules: achievement.eligibilityRules as never,
      userId: userId,
      scopeId,
    })
    if (!eligible) {
      throw new APIError('Eligibility rules not met for this achievement.', 400)
    }

    data.status = achievement.requiresReview === false ? 'approved' : 'pending'
    return data
  }

  if (operation === 'update') {
    // Cannot reassign user or achievement on an existing request.
    if (originalDoc) {
      data.user = (originalDoc as { user?: unknown }).user
      data.achievement = (originalDoc as { achievement?: unknown }).achievement
    }
  }

  return data
}

/**
 * When a request becomes approved, grant the achievement (create or pending→approved).
 */
export const grantOnApprovedRequest: CollectionAfterChangeHook = async ({
  doc,
  operation,
  previousDoc,
  req,
}) => {
  if (req.context?.achievementGranting) return doc

  const status = (doc as { status?: string }).status
  if (status !== 'approved') return doc

  const previousStatus =
    operation === 'update' ? (previousDoc as { status?: string } | undefined)?.status : undefined
  if (previousStatus === 'approved') return doc

  const achievementId = relationId((doc as { achievement?: unknown }).achievement)
  const userId = relationId((doc as { user?: unknown }).user)
  if (!achievementId || !userId) {
    throw new APIError('Approved request missing achievement or user', 400)
  }

  const scopeId = scopeIdOf(doc as unknown as Record<string, unknown>)
  const note = (doc as { note?: string | null }).note

  req.context.achievementGranting = true
  try {
    await grantAchievement({
      req,
      userId,
      achievementId,
      scopeId,
      note,
    })
  } finally {
    req.context.achievementGranting = false
  }

  return doc
}
