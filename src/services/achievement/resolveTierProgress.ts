import type { Payload, PayloadRequest } from 'payload'

import { collectionOf } from '../../collections/helpers'
import { evaluateRuleProgress } from './evaluateRules'
import { relationId } from './relationId'
import { resolveCurrentTier, type ResolvedTier } from './resolveCurrentTier'

export type TierLadderProgress = {
  current: ResolvedTier | null
  next: ResolvedTier | null
  /** 0..1 progress toward unlocking `next` (1 when there is no next tier). */
  progressTowardNext: number
  /**
   * 0..1 position along the ordered ladder for UI tracks:
   * `(currentIndex + progressTowardNext) / (tierCount - 1)`.
   * When no current tier yet, uses `progressTowardNext / (tierCount - 1)`.
   */
  ladderProgress: number
  tiers: Array<{ id: string; name?: string; slug?: string; rank: number }>
}

type TierDoc = {
  id: string
  name?: string
  slug?: string
  rank?: number
  scope?: unknown
  unlockRules?: unknown
}

/**
 * Current tier, next tier, and fractional progress toward the next unlock rules.
 *
 * Progress uses {@link evaluateRuleProgress}: AND averages requirement children equally
 * (`tier-at-least` is a gate and is skipped). Nested `achievement-complete` rules roll
 * up eligibility progress when the child is not yet granted.
 */
export async function resolveTierProgress(args: {
  payload: Payload
  req?: PayloadRequest
  userId: string
  scopeId?: string | null
  locale?: string
}): Promise<TierLadderProgress> {
  if (!args.userId) {
    return { current: null, next: null, progressTowardNext: 0, ladderProgress: 0, tiers: [] }
  }

  const scopeId = args.scopeId ?? null
  const locale = args.locale ?? (args.req?.locale || undefined)
  const where = scopeId
    ? { or: [{ scope: { equals: scopeId } }, { scope: { exists: false } }] }
    : undefined

  const result = await args.payload.find({
    collection: collectionOf('tiers'),
    depth: 0,
    limit: 100,
    pagination: false,
    overrideAccess: true,
    req: args.req,
    sort: 'rank',
    ...(locale ? { locale: locale as never } : {}),
    ...(where ? { where } : {}),
  })

  const ordered = [...(result.docs as TierDoc[])].sort(
    (a, b) => Number(a.rank ?? 0) - Number(b.rank ?? 0),
  )

  const tiers = ordered.map((tier) => ({
    id: String(tier.id),
    rank: Number(tier.rank ?? 0),
    ...(typeof tier.name === 'string' && tier.name ? { name: tier.name } : {}),
    ...(typeof tier.slug === 'string' && tier.slug ? { slug: tier.slug } : {}),
  }))

  if (ordered.length === 0) {
    return { current: null, next: null, progressTowardNext: 0, ladderProgress: 0, tiers }
  }

  const current = await resolveCurrentTier({
    payload: args.payload,
    req: args.req,
    userId: args.userId,
    scopeId,
    locale,
  })

  const currentIndex = current
    ? ordered.findIndex((tier) => String(tier.id) === current.id)
    : -1

  const nextDoc =
    currentIndex >= 0 && currentIndex < ordered.length - 1
      ? ordered[currentIndex + 1]
      : currentIndex < 0
        ? ordered[0]
        : undefined

  const req = args.req ?? ({ payload: args.payload } as PayloadRequest)

  let progressTowardNext = 1
  if (nextDoc) {
    progressTowardNext = await evaluateRuleProgress({
      payload: args.payload,
      req,
      rules: nextDoc.unlockRules as never,
      userId: args.userId,
      scopeId,
      ladderRank: current?.rank ?? null,
    })
  }

  const next: ResolvedTier | null = nextDoc
    ? {
        id: String(nextDoc.id),
        rank: Number(nextDoc.rank ?? 0),
        scopeId: relationId(nextDoc.scope),
        ...(typeof nextDoc.name === 'string' && nextDoc.name ? { name: nextDoc.name } : {}),
        ...(typeof nextDoc.slug === 'string' && nextDoc.slug ? { slug: nextDoc.slug } : {}),
      }
    : null

  const lastIndex = Math.max(1, ordered.length - 1)
  let ladderProgress: number
  if (ordered.length < 2) {
    ladderProgress = current || progressTowardNext >= 1 ? 1 : progressTowardNext
  } else if (!next) {
    ladderProgress = 1
  } else if (currentIndex < 0) {
    ladderProgress = progressTowardNext / lastIndex
  } else {
    ladderProgress = (currentIndex + progressTowardNext) / lastIndex
  }

  return {
    current,
    next,
    progressTowardNext,
    ladderProgress: Math.max(0, Math.min(1, ladderProgress)),
    tiers,
  }
}
