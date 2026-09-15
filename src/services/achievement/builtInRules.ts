import type { AchievementRuleEvalArgs, AchievementRuleType } from '../../types.js'
import { collectionOf } from '../../collections/helpers.js'
import { actorSnapshotMeetsTier } from './actorTierSnapshot.js'
import { relationId } from './relationId.js'
import { resolveMetricValue } from './resolveMetricValue.js'
import { userScopeIncludingUnscopedWhere } from './where.js'
import type { Where } from 'payload'

function clamp01(value: number): number {
  if (!Number.isFinite(value)) return 0
  return Math.max(0, Math.min(1, value))
}

async function resolveMetricId(args: {
  payload: AchievementRuleEvalArgs['payload']
  rule: Record<string, unknown>
}): Promise<string | null> {
  const metricId = relationId(args.rule.metric)
  if (metricId) return metricId
  const metricSlug = typeof args.rule.metricSlug === 'string' ? args.rule.metricSlug : ''
  if (!metricSlug) return null
  const found = await args.payload.find({
    collection: collectionOf('metrics'),
    depth: 0,
    limit: 1,
    overrideAccess: true,
    where: { slug: { equals: metricSlug } },
  })
  return relationId(found.docs[0])
}

async function resolveEventTypeId(args: {
  payload: AchievementRuleEvalArgs['payload']
  rule: Record<string, unknown>
}): Promise<string | null> {
  let eventTypeId = relationId(args.rule.eventType)
  if (eventTypeId) {
    // Seeded rules may store a slug string in `eventType` before resolve; only treat
    // opaque ids as final when a catalog row exists.
    const byId = await args.payload.find({
      collection: collectionOf('eventTypes'),
      depth: 0,
      limit: 1,
      overrideAccess: true,
      where: { id: { equals: eventTypeId } },
    })
    if (relationId(byId.docs[0])) return eventTypeId
  }

  const slugCandidate =
    (typeof args.rule.eventTypeSlug === 'string' && args.rule.eventTypeSlug) ||
    (typeof args.rule.eventType === 'string' && args.rule.eventType) ||
    ''
  if (!slugCandidate) return null

  const found = await args.payload.find({
    collection: collectionOf('eventTypes'),
    depth: 0,
    limit: 1,
    overrideAccess: true,
    where: { slug: { equals: slugCandidate } },
  })
  return relationId(found.docs[0])
}

async function resolveActorTierMinimumRank(args: {
  payload: AchievementRuleEvalArgs['payload']
  rule: Record<string, unknown>
}): Promise<number | null> {
  const fromRelation = relationId(args.rule.actorTier)
  const slug =
    typeof args.rule.actorTierSlug === 'string' && args.rule.actorTierSlug
      ? args.rule.actorTierSlug
      : ''
  if (!fromRelation && !slug) return null

  if (fromRelation) {
    try {
      const doc = (await args.payload.findByID({
        collection: collectionOf('tiers'),
        id: fromRelation,
        depth: 0,
        overrideAccess: true,
        select: { rank: true },
      })) as { rank?: number } | null
      if (doc && typeof doc.rank === 'number' && Number.isFinite(doc.rank)) return doc.rank
    } catch {
      /* fall through to slug */
    }
  }

  if (!slug) return null
  const found = await args.payload.find({
    collection: collectionOf('tiers'),
    depth: 0,
    limit: 1,
    overrideAccess: true,
    where: { slug: { equals: slug } },
    select: { rank: true },
  })
  const rank = (found.docs[0] as { rank?: number } | undefined)?.rank
  return typeof rank === 'number' && Number.isFinite(rank) ? rank : null
}

async function countMatchingEventLogs(args: {
  payload: AchievementRuleEvalArgs['payload']
  rule: Record<string, unknown>
  userId: string
  scopeId: string | null
}): Promise<number> {
  const eventTypeId = await resolveEventTypeId({ payload: args.payload, rule: args.rule })
  if (!eventTypeId) return 0

  const where = {
    and: [
      userScopeIncludingUnscopedWhere(args.userId, args.scopeId),
      { type: { equals: eventTypeId } },
    ],
  }

  const minimumRank = await resolveActorTierMinimumRank({
    payload: args.payload,
    rule: args.rule,
  })
  if (minimumRank == null) {
    const result = await args.payload.count({
      collection: collectionOf('logs'),
      overrideAccess: true,
      where,
    })
    return result.totalDocs
  }

  const { docs } = await args.payload.find({
    collection: collectionOf('logs'),
    depth: 0,
    overrideAccess: true,
    pagination: false,
    select: { actorTiers: true },
    where,
  })

  return docs.filter((doc) =>
    actorSnapshotMeetsTier({
      rows: (doc as { actorTiers?: unknown }).actorTiers,
      scopeId: args.scopeId,
      minimumRank,
    }),
  ).length
}

type AchievementRef = {
  id: string | null
  slug: string
  eligibilityRules?: unknown
  completionRules?: unknown
}

async function resolveAchievementRef(args: {
  payload: AchievementRuleEvalArgs['payload']
  rule: Record<string, unknown>
  scopeId: string | null
}): Promise<AchievementRef> {
  let requiredId = relationId(args.rule.achievement)
  let requiredSlug = typeof args.rule.achievementSlug === 'string' ? args.rule.achievementSlug : ''
  let eligibilityRules: unknown
  let completionRules: unknown

  if (!requiredId && requiredSlug) {
    const found = await args.payload.find({
      collection: collectionOf('achievements'),
      depth: 0,
      limit: 1,
      overrideAccess: true,
      where: args.scopeId
        ? {
            and: [{ slug: { equals: requiredSlug } }, { scope: { equals: args.scopeId } }],
          }
        : { slug: { equals: requiredSlug } },
    })
    const doc = found.docs[0] as
      | { id?: string; slug?: string; eligibilityRules?: unknown; completionRules?: unknown }
      | undefined
    requiredId = relationId(doc)
    requiredSlug = String(doc?.slug ?? requiredSlug)
    eligibilityRules = doc?.eligibilityRules
    completionRules = doc?.completionRules
  }

  if (requiredId && (eligibilityRules === undefined || completionRules === undefined || !requiredSlug)) {
    const doc = (await args.payload.findByID({
      collection: collectionOf('achievements'),
      id: requiredId,
      depth: 0,
      overrideAccess: true,
    })) as { slug?: string; eligibilityRules?: unknown; completionRules?: unknown } | null
    requiredSlug = requiredSlug || String(doc?.slug ?? '')
    eligibilityRules = eligibilityRules ?? doc?.eligibilityRules
    completionRules = completionRules ?? doc?.completionRules
  }

  return { id: requiredId, slug: requiredSlug, eligibilityRules, completionRules }
}

async function isAchievementGranted(args: {
  payload: AchievementRuleEvalArgs['payload']
  userId: string
  scopeId: string | null
  requiredId: string | null
  requiredSlug: string
}): Promise<boolean> {
  if (!args.requiredId && !args.requiredSlug) return false

  const grantClauses: Where[] = [{ user: { equals: args.userId } }]
  if (args.scopeId) grantClauses.push({ scope: { equals: args.scopeId } })
  if (args.requiredId) grantClauses.push({ achievement: { equals: args.requiredId } })

  const grants = await args.payload.find({
    collection: collectionOf('grants'),
    depth: args.requiredSlug && !args.requiredId ? 1 : 0,
    limit: args.requiredId ? 1 : 50,
    overrideAccess: true,
    where: { and: grantClauses },
  })

  if (args.requiredId) return grants.docs.length > 0

  return grants.docs.some((doc) => {
    const achievement = (doc as { achievement?: { slug?: string } | string }).achievement
    if (achievement && typeof achievement === 'object') {
      return achievement.slug === args.requiredSlug
    }
    return false
  })
}

export const builtInRuleTypes: AchievementRuleType[] = [
  {
    type: 'tier-at-least',
    progressRole: 'gate',
    async evaluate({ payload, req, rule, userId, scopeId, ladderRank }) {
      const tierId = relationId(rule.tier)
      let requiredRank: number | undefined

      if (tierId) {
        const tier = (await payload.findByID({
          collection: collectionOf('tiers'),
          id: tierId,
          depth: 0,
          overrideAccess: true,
        })) as { rank?: number } | null
        requiredRank = tier?.rank
      } else {
        const tierSlug = String(rule.tierSlug ?? '')
        if (!tierSlug) return false

        const tiers = await payload.find({
          collection: collectionOf('tiers'),
          depth: 0,
          limit: 1,
          overrideAccess: true,
          where: scopeId
            ? { and: [{ slug: { equals: tierSlug } }, { scope: { equals: scopeId } }] }
            : { slug: { equals: tierSlug } },
        })
        requiredRank = (tiers.docs[0] as { rank?: number } | undefined)?.rank
      }

      if (typeof requiredRank !== 'number') return false

      let currentRank = ladderRank
      if (currentRank === undefined) {
        const { resolveCurrentTier } = await import('./resolveCurrentTier.js')
        const current = await resolveCurrentTier({
          payload,
          req,
          userId,
          scopeId,
        })
        currentRank = current?.rank ?? null
      }

      return typeof currentRank === 'number' && currentRank >= requiredRank
    },
  },
  {
    type: 'achievement-complete',
    async evaluate({ payload, rule, userId, scopeId }) {
      const ref = await resolveAchievementRef({ payload, rule, scopeId })
      return isAchievementGranted({
        payload,
        userId,
        scopeId,
        requiredId: ref.id,
        requiredSlug: ref.slug,
      })
    },
    async progress(args) {
      const { payload, req, rule, userId, scopeId, ladderRank, progressVisited } = args
      const ref = await resolveAchievementRef({ payload, rule, scopeId })
      if (!ref.id && !ref.slug) return 0

      const granted = await isAchievementGranted({
        payload,
        userId,
        scopeId,
        requiredId: ref.id,
        requiredSlug: ref.slug,
      })
      if (granted) return 1

      const visitKey = ref.id || ref.slug
      const visited = progressVisited ?? new Set<string>()
      if (visited.has(visitKey)) return 0
      visited.add(visitKey)

      const { evaluateRuleProgress, ruleGroupHasProgressRequirements } = await import('./evaluateRules.js')
      const composition = ruleGroupHasProgressRequirements(ref.completionRules as never)
        ? ref.completionRules
        : ref.eligibilityRules
      if (!ruleGroupHasProgressRequirements(composition as never)) return 0

      return evaluateRuleProgress({
        payload,
        req,
        rules: composition as never,
        userId,
        scopeId,
        ladderRank,
        progressVisited: visited,
      })
    },
  },
  {
    type: 'metric-minimum',
    async evaluate({ payload, req, rule, userId, scopeId }) {
      const resolvedId = await resolveMetricId({ payload, rule })
      if (!resolvedId) return false
      const minimum = Number(rule.minimum ?? 0)
      const value = await resolveMetricValue({
        payload,
        req,
        metric: resolvedId,
        userId,
        scopeId,
      })
      return value >= minimum
    },
    async progress({ payload, req, rule, userId, scopeId }) {
      const resolvedId = await resolveMetricId({ payload, rule })
      if (!resolvedId) return 0
      const minimum = Number(rule.minimum ?? 0)
      if (!(minimum > 0)) return 1
      const value = await resolveMetricValue({
        payload,
        req,
        metric: resolvedId,
        userId,
        scopeId,
      })
      return clamp01(value / minimum)
    },
  },
  {
    type: 'event-count',
    async evaluate({ payload, rule, userId, scopeId }) {
      const needed = Number(rule.count ?? 1)
      const total = await countMatchingEventLogs({ payload, rule, userId, scopeId })
      return total >= needed
    },
    async progress({ payload, rule, userId, scopeId }) {
      const needed = Number(rule.count ?? 1)
      if (!(needed > 0)) return 1
      const total = await countMatchingEventLogs({ payload, rule, userId, scopeId })
      return clamp01(total / needed)
    },
  },
]
