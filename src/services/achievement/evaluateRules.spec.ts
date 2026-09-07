import { afterEach, describe, expect, mock, test } from 'bun:test'

import { resetAchievementOptions, setAchievementOptions } from '../../options-store'
import { evaluateRules, evaluateRuleProgress, normalizeRuleGroup } from './evaluateRules'

afterEach(() => {
  resetAchievementOptions()
})

const pass = { type: 'test-pass' as const }
const fail = { type: 'test-fail' as const }

function installTestRules() {
  setAchievementOptions({
    extensions: {
      ruleTypes: [
        { type: 'test-pass', evaluate: () => true },
        { type: 'test-fail', evaluate: () => false },
      ],
    },
  })
}

describe('normalizeRuleGroup', () => {
  test('treats nullish input as empty AND', () => {
    expect(normalizeRuleGroup(null)).toEqual({ combinator: 'and', rules: [] })
    expect(normalizeRuleGroup(undefined)).toEqual({ combinator: 'and', rules: [] })
  })

  test('treats a bare array as AND', () => {
    expect(normalizeRuleGroup([pass])).toEqual({ combinator: 'and', rules: [pass] })
  })

  test('defaults unknown combinators to AND', () => {
    expect(normalizeRuleGroup({ combinator: 'xor' as 'and', rules: [pass] })).toEqual({
      combinator: 'and',
      rules: [pass],
    })
  })
})

describe('evaluateRules', () => {
  test('returns true when no rules', async () => {
    const ok = await evaluateRules({
      payload: {} as never,
      req: {} as never,
      rules: [],
      userId: 'u1',
      scopeId: null,
    })
    expect(ok).toBe(true)
  })

  test('returns false for unknown rule type', async () => {
    const ok = await evaluateRules({
      payload: {} as never,
      req: {} as never,
      rules: [{ type: 'not-a-real-rule' }],
      userId: 'u1',
      scopeId: null,
    })
    expect(ok).toBe(false)
  })

  test('AND passes only when every child passes', async () => {
    installTestRules()
    const allPass = await evaluateRules({
      payload: {} as never,
      req: {} as never,
      rules: { combinator: 'and', rules: [pass, pass] },
      userId: 'u1',
      scopeId: null,
    })
    const oneFails = await evaluateRules({
      payload: {} as never,
      req: {} as never,
      rules: { combinator: 'and', rules: [pass, fail] },
      userId: 'u1',
      scopeId: null,
    })
    expect(allPass).toBe(true)
    expect(oneFails).toBe(false)
  })

  test('OR passes when any child passes', async () => {
    installTestRules()
    const ok = await evaluateRules({
      payload: {} as never,
      req: {} as never,
      rules: { combinator: 'or', rules: [fail, pass] },
      userId: 'u1',
      scopeId: null,
    })
    expect(ok).toBe(true)
  })

  test('OR fails when every child fails', async () => {
    installTestRules()
    const ok = await evaluateRules({
      payload: {} as never,
      req: {} as never,
      rules: { combinator: 'or', rules: [fail, fail] },
      userId: 'u1',
      scopeId: null,
    })
    expect(ok).toBe(false)
  })

  test('nested group: AND of (leaf OR group)', async () => {
    installTestRules()
    const ok = await evaluateRules({
      payload: {} as never,
      req: {} as never,
      rules: {
        combinator: 'and',
        rules: [
          pass,
          {
            type: 'group',
            combinator: 'or',
            rules: [fail, pass],
          },
        ],
      },
      userId: 'u1',
      scopeId: null,
    })
    const failsWhenNestedOrFails = await evaluateRules({
      payload: {} as never,
      req: {} as never,
      rules: {
        combinator: 'and',
        rules: [
          pass,
          {
            type: 'group',
            combinator: 'or',
            rules: [fail, fail],
          },
        ],
      },
      userId: 'u1',
      scopeId: null,
    })
    expect(ok).toBe(true)
    expect(failsWhenNestedOrFails).toBe(false)
  })

  test('empty nested AND passes; empty nested OR fails', async () => {
    const emptyAnd = await evaluateRules({
      payload: {} as never,
      req: {} as never,
      rules: { combinator: 'and', rules: [{ type: 'group', combinator: 'and', rules: [] }] },
      userId: 'u1',
      scopeId: null,
    })
    const emptyOr = await evaluateRules({
      payload: {} as never,
      req: {} as never,
      rules: { combinator: 'and', rules: [{ type: 'group', combinator: 'or', rules: [] }] },
      userId: 'u1',
      scopeId: null,
    })
    expect(emptyAnd).toBe(true)
    expect(emptyOr).toBe(false)
  })

  test('empty top-level OR still passes (no rules means open)', async () => {
    const ok = await evaluateRules({
      payload: {} as never,
      req: {} as never,
      rules: { combinator: 'or', rules: [] },
      userId: 'u1',
      scopeId: null,
    })
    expect(ok).toBe(true)
  })
})

describe('evaluateRuleProgress', () => {
  test('returns 1 when no rules', async () => {
    const progress = await evaluateRuleProgress({
      payload: {} as never,
      req: {} as never,
      rules: [],
      userId: 'u1',
      scopeId: null,
    })
    expect(progress).toBe(1)
  })

  test('AND averages requirement children equally and skips gates', async () => {
    setAchievementOptions({
      extensions: {
        ruleTypes: [
          { type: 'test-pass', evaluate: () => true },
          { type: 'test-fail', evaluate: () => false },
          {
            type: 'test-half',
            evaluate: () => false,
            progress: () => 0.5,
          },
          {
            type: 'test-gate',
            progressRole: 'gate',
            evaluate: () => true,
          },
        ],
      },
    })

    const equal = await evaluateRuleProgress({
      payload: {} as never,
      req: {} as never,
      rules: {
        combinator: 'and',
        rules: [{ type: 'test-pass' }, { type: 'test-fail' }],
      },
      userId: 'u1',
      scopeId: null,
    })
    expect(equal).toBe(0.5)

    const skipsGate = await evaluateRuleProgress({
      payload: {} as never,
      req: {} as never,
      rules: {
        combinator: 'and',
        rules: [{ type: 'test-gate' }, { type: 'test-half' }],
      },
      userId: 'u1',
      scopeId: null,
    })
    expect(skipsGate).toBe(0.5)

    const gatesOnly = await evaluateRuleProgress({
      payload: {} as never,
      req: {} as never,
      rules: {
        combinator: 'and',
        rules: [{ type: 'test-gate' }],
      },
      userId: 'u1',
      scopeId: null,
    })
    expect(gatesOnly).toBe(1)
  })

  test('OR takes the best child', async () => {
    setAchievementOptions({
      extensions: {
        ruleTypes: [
          { type: 'test-fail', evaluate: () => false },
          {
            type: 'test-half',
            evaluate: () => false,
            progress: () => 0.5,
          },
        ],
      },
    })

    const progress = await evaluateRuleProgress({
      payload: {} as never,
      req: {} as never,
      rules: {
        combinator: 'or',
        rules: [{ type: 'test-fail' }, { type: 'test-half' }],
      },
      userId: 'u1',
      scopeId: null,
    })
    expect(progress).toBe(0.5)
  })

  test('achievement-complete rolls up nested completion rules equally', async () => {
    setAchievementOptions({})

    const catalog: Record<
      string,
      { id: string; slug: string; eligibilityRules: unknown; completionRules: unknown }
    > = {
      path: {
        id: 'path',
        slug: 'path',
        eligibilityRules: { combinator: 'and', rules: [] },
        completionRules: {
          combinator: 'and',
          rules: [
            { type: 'achievement-complete', achievement: 'child-b' },
            { type: 'achievement-complete', achievement: 'person' },
          ],
        },
      },
      childB: {
        id: 'child-b',
        slug: 'child-b',
        eligibilityRules: { combinator: 'and', rules: [] },
        completionRules: { combinator: 'and', rules: [] },
      },
      person: {
        id: 'person',
        slug: 'person',
        eligibilityRules: { combinator: 'and', rules: [] },
        completionRules: { combinator: 'and', rules: [] },
      },
    }

    const findByID = mock(async ({ id }: { id: string }) => catalog[id] ?? null)
    const find = mock(async ({ collection, where }: { collection: string; where?: { and?: Array<Record<string, { equals?: string }>> } }) => {
      if (String(collection).includes('grants')) {
        const achievementId = where?.and?.find((clause) => clause.achievement)?.achievement?.equals
        if (achievementId === 'child-b') return { docs: [{ id: 'g-child-b' }] }
        return { docs: [] }
      }
      return { docs: [] }
    })

    const progress = await evaluateRuleProgress({
      payload: { find, findByID } as never,
      req: {} as never,
      rules: {
        combinator: 'and',
        rules: [{ type: 'achievement-complete', achievement: 'path' }],
      },
      userId: 'u1',
      scopeId: null,
    })

    expect(progress).toBe(0.5)
  })
})
