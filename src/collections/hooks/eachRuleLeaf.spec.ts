import { describe, expect, test } from 'bun:test'

import { eachRuleLeaf } from './eachRuleLeaf.js'

describe('eachRuleLeaf', () => {
  test('walks nested groups', () => {
    const types: string[] = []
    eachRuleLeaf(
      {
        combinator: 'and',
        rules: [
          { type: 'tier-at-least', tier: 't1' },
          {
            type: 'group',
            combinator: 'or',
            rules: [
              { type: 'event-count', eventType: 'e1', count: 1 },
              { type: 'metric-minimum', metric: 'm1', minimum: 3 },
            ],
          },
        ],
      },
      (rule: Record<string, unknown>) => types.push(String(rule.type)),
    )
    expect(types).toEqual(['tier-at-least', 'event-count', 'metric-minimum'])
  })

  test('visits leaves that carry empty rules arrays and default combinator', () => {
    const types: string[] = []
    eachRuleLeaf(
      {
        combinator: 'and',
        rules: [
          {
            type: 'tier-at-least',
            tier: 't1',
            combinator: 'and',
            rules: [],
          },
          {
            type: 'metric-minimum',
            metric: 'm1',
            minimum: 365,
            combinator: 'and',
            rules: [],
          },
        ],
      },
      (rule: Record<string, unknown>) => types.push(String(rule.type)),
    )
    expect(types).toEqual(['tier-at-least', 'metric-minimum'])
  })
})
