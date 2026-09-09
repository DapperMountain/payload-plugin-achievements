import { describe, expect, test } from 'bun:test'
import { APIError } from 'payload'

import { setAchievementOptions } from '../../options-store.js'
import { assertRuleGroupValid, validateRuleGroup, validateRuleNode } from './validateRules.js'

describe('validateRuleNode', () => {
  test('requires fields for built-in leaf types', () => {
    expect(validateRuleNode({ type: 'tier-at-least' })).toMatch(/tier/i)
    expect(validateRuleNode({ type: 'tier-at-least', tier: 't1' })).toBeNull()

    expect(validateRuleNode({ type: 'metric-minimum', metric: 'm1' })).toMatch(/minimum/i)
    expect(validateRuleNode({ type: 'metric-minimum', metric: 'm1', minimum: 10 })).toBeNull()

    expect(validateRuleNode({ type: 'event-count', eventType: 'e1' })).toMatch(/count/i)
    expect(validateRuleNode({ type: 'event-count', eventType: 'e1', count: 2 })).toBeNull()

    expect(validateRuleNode({ type: 'achievement-complete' })).toMatch(/achievement/i)
    expect(validateRuleNode({ type: 'achievement-complete', achievement: 'a1' })).toBeNull()

    expect(validateRuleNode({ type: 'elapsed-since', amount: 30 })).toBeNull()
    expect(validateRuleNode({ type: 'elapsed-since', since: 'first-event', amount: 7 })).toMatch(
      /event type/i,
    )
    expect(
      validateRuleNode({
        type: 'elapsed-since',
        since: 'first-event',
        eventType: 'e1',
        amount: 7,
        unit: 'days',
      }),
    ).toBeNull()

    expect(
      validateRuleNode({
        type: 'elapsed-since',
        since: 'not-a-real-anchor',
        amount: 30,
        unit: 'days',
      }),
    ).toMatch(/valid since/i)

    setAchievementOptions({
      extensions: {
        metricAnchors: {
          'membership-granted': async () => new Date(),
        },
      },
    })
    expect(
      validateRuleNode({
        type: 'elapsed-since',
        since: 'membership-granted',
        amount: 365,
        unit: 'days',
      }),
    ).toBeNull()
    setAchievementOptions({})
  })

  test('rejects empty groups and validates nested leaves', () => {
    expect(validateRuleNode({ type: 'group', combinator: 'or', rules: [] })).toMatch(/at least one/i)
    expect(
      validateRuleNode({
        type: 'group',
        combinator: 'and',
        rules: [{ type: 'tier-at-least' }],
      }),
    ).toMatch(/tier/i)
    expect(
      validateRuleNode({
        type: 'group',
        combinator: 'and',
        rules: [{ type: 'tier-at-least', tier: 't1' }],
      }),
    ).toBeNull()
  })

  test('allows unknown extension types without field checks', () => {
    expect(validateRuleNode({ type: 'host.custom' })).toBeNull()
  })
})

describe('validateRuleGroup', () => {
  test('allows empty top-level lists', () => {
    expect(validateRuleGroup({ combinator: 'and', rules: [] })).toBeNull()
    expect(validateRuleGroup([])).toBeNull()
  })

  test('assertRuleGroupValid throws APIError', () => {
    expect(() =>
      assertRuleGroupValid({ combinator: 'and', rules: [{ type: 'tier-at-least' }] }, 'Unlock rules'),
    ).toThrow(APIError)
  })
})
