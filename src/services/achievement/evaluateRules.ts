import { relationId } from './relationId'
import type { PayloadRequest } from 'payload'

import { getRuleTypeMap } from '../../extensions/registry'

export type RuleGroup = {
  combinator?: 'and' | 'or' | null
  rules?: Record<string, unknown>[] | null
}

export function normalizeRuleGroup(
  input: RuleGroup | Record<string, unknown>[] | null | undefined,
): { combinator: 'and' | 'or'; rules: Record<string, unknown>[] } {
  if (!input) return { combinator: 'and', rules: [] }
  if (Array.isArray(input)) return { combinator: 'and', rules: input }
  return {
    combinator: input.combinator === 'or' ? 'or' : 'and',
    rules: input.rules ?? [],
  }
}

/** True when the tree has at least one non-gate requirement (nested achievements, counts, metrics). */
export function ruleGroupHasProgressRequirements(
  input: RuleGroup | Record<string, unknown>[] | null | undefined,
): boolean {
  return normalizeRuleGroup(input).rules.some((rule) => contributesToProgress(rule))
}

export type AchievementCompleteRef = {
  id: string | null
  slug: string
}

/**
 * Achievement-complete leaves in document order (nested groups included).
 * First appearance wins when the same achievement is listed twice.
 */
export function collectAchievementCompleteRefs(
  input: RuleGroup | Record<string, unknown>[] | null | undefined,
): AchievementCompleteRef[] {
  const out: AchievementCompleteRef[] = []
  const seen = new Set<string>()

  const walk = (rules: Record<string, unknown>[]) => {
    for (const rule of rules) {
      if (rule.type === 'group' && Array.isArray(rule.rules)) {
        walk(rule.rules as Record<string, unknown>[])
        continue
      }
      if (rule.type !== 'achievement-complete') continue

      const id = relationId(rule.achievement)
      const populatedSlug =
        rule.achievement && typeof rule.achievement === 'object' && 'slug' in rule.achievement
          ? String((rule.achievement as { slug?: unknown }).slug ?? '')
          : ''
      const slug =
        (typeof rule.achievementSlug === 'string' ? rule.achievementSlug : '') || populatedSlug
      const key = id || slug
      if (!key || seen.has(key)) continue
      seen.add(key)
      out.push({ id, slug })
    }
  }

  walk(normalizeRuleGroup(input).rules)
  return out
}

function clamp01(value: number): number {
  if (!Number.isFinite(value)) return 0
  return Math.max(0, Math.min(1, value))
}

function contributesToProgress(rule: Record<string, unknown>): boolean {
  if (rule.type === 'group') {
    const children = Array.isArray(rule.rules) ? (rule.rules as Record<string, unknown>[]) : []
    return children.some((child) => contributesToProgress(child))
  }
  const impl = getRuleTypeMap().get(String(rule.type ?? ''))
  return impl?.progressRole !== 'gate'
}

export async function evaluateRules(args: {
  payload: PayloadRequest['payload']
  req: PayloadRequest
  rules: RuleGroup | Record<string, unknown>[] | null | undefined
  userId: string
  scopeId: string | null
  /** Rank unlocked so far during a ladder walk (`null` = none). */
  ladderRank?: number | null
}): Promise<boolean> {
  return evaluateGroup({
    payload: args.payload,
    req: args.req,
    group: normalizeRuleGroup(args.rules),
    userId: args.userId,
    scopeId: args.scopeId,
    ladderRank: args.ladderRank,
    isRoot: true,
  })
}

/**
 * Fractional progress (0..1) toward satisfying a rule tree.
 *
 * Derived from the tree — no catalog `weight` field:
 * - **AND**: equal average of *requirement* children (`tier-at-least` is a gate and is skipped).
 * - **OR**: best child (max).
 * - Leaves: rule-type `progress` when provided; `achievement-complete` rolls up nested
 *   eligibility when the grant is missing; otherwise `evaluate` → 0|1.
 */
export async function evaluateRuleProgress(args: {
  payload: PayloadRequest['payload']
  req: PayloadRequest
  rules: RuleGroup | Record<string, unknown>[] | null | undefined
  userId: string
  scopeId: string | null
  ladderRank?: number | null
  progressVisited?: Set<string>
}): Promise<number> {
  return progressGroup({
    payload: args.payload,
    req: args.req,
    group: normalizeRuleGroup(args.rules),
    userId: args.userId,
    scopeId: args.scopeId,
    ladderRank: args.ladderRank,
    progressVisited: args.progressVisited,
    isRoot: true,
  })
}

async function evaluateGroup(args: {
  payload: PayloadRequest['payload']
  req: PayloadRequest
  group: { combinator: 'and' | 'or'; rules: Record<string, unknown>[] }
  userId: string
  scopeId: string | null
  ladderRank?: number | null
  /** Root eligibility/unlock lists treat empty as pass; nested empty OR fails. */
  isRoot?: boolean
}): Promise<boolean> {
  const { combinator, rules } = args.group
  if (rules.length === 0) {
    if (args.isRoot) return true
    return combinator !== 'or'
  }

  const map = getRuleTypeMap()

  const evalNode = async (rule: Record<string, unknown>): Promise<boolean> => {
    if (rule.type === 'group') {
      return evaluateGroup({
        payload: args.payload,
        req: args.req,
        group: {
          combinator: rule.combinator === 'or' ? 'or' : 'and',
          rules: Array.isArray(rule.rules) ? (rule.rules as Record<string, unknown>[]) : [],
        },
        userId: args.userId,
        scopeId: args.scopeId,
        ladderRank: args.ladderRank,
        isRoot: false,
      })
    }

    const type = String(rule.type ?? '')
    const impl = map.get(type)
    if (!impl) return false
    return Boolean(
      await impl.evaluate({
        payload: args.payload,
        req: args.req,
        rule,
        userId: args.userId,
        scopeId: args.scopeId,
        ladderRank: args.ladderRank,
      }),
    )
  }

  if (combinator === 'or') {
    for (const rule of rules) {
      if (await evalNode(rule)) return true
    }
    return false
  }

  for (const rule of rules) {
    if (!(await evalNode(rule))) return false
  }
  return true
}

async function progressGroup(args: {
  payload: PayloadRequest['payload']
  req: PayloadRequest
  group: { combinator: 'and' | 'or'; rules: Record<string, unknown>[] }
  userId: string
  scopeId: string | null
  ladderRank?: number | null
  progressVisited?: Set<string>
  isRoot?: boolean
}): Promise<number> {
  const { combinator, rules } = args.group
  if (rules.length === 0) {
    if (args.isRoot) return 1
    return combinator === 'or' ? 0 : 1
  }

  const map = getRuleTypeMap()

  const evalArgs = (rule: Record<string, unknown>) => ({
    payload: args.payload,
    req: args.req,
    rule,
    userId: args.userId,
    scopeId: args.scopeId,
    ladderRank: args.ladderRank,
    progressVisited: args.progressVisited,
  })

  const progressNode = async (rule: Record<string, unknown>): Promise<number> => {
    if (rule.type === 'group') {
      return progressGroup({
        payload: args.payload,
        req: args.req,
        group: {
          combinator: rule.combinator === 'or' ? 'or' : 'and',
          rules: Array.isArray(rule.rules) ? (rule.rules as Record<string, unknown>[]) : [],
        },
        userId: args.userId,
        scopeId: args.scopeId,
        ladderRank: args.ladderRank,
        progressVisited: args.progressVisited,
        isRoot: false,
      })
    }

    const type = String(rule.type ?? '')
    const impl = map.get(type)
    if (!impl) return 0

    if (impl.progress) {
      return clamp01(Number(await impl.progress(evalArgs(rule))))
    }

    const passed = await impl.evaluate(evalArgs(rule))
    return passed ? 1 : 0
  }

  if (combinator === 'or') {
    let best = 0
    for (const rule of rules) {
      best = Math.max(best, await progressNode(rule))
      if (best >= 1) return 1
    }
    return best
  }

  const requirements = rules.filter((rule) => contributesToProgress(rule))
  if (requirements.length === 0) {
    for (const rule of rules) {
      if ((await progressNode(rule)) < 1) return 0
    }
    return 1
  }

  let sum = 0
  for (const rule of requirements) {
    sum += await progressNode(rule)
  }
  return clamp01(sum / requirements.length)
}
