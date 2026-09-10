import { afterEach, describe, expect, test } from 'bun:test'

import { resetAchievementOptions, setAchievementOptions } from '../../options-store.js'
import { buildUnlockRequirementLeaves } from './buildUnlockRequirementLeaves.js'

afterEach(() => {
  resetAchievementOptions()
})

function installTestRules() {
  setAchievementOptions({
    extensions: {
      ruleTypes: [
        { type: 'test-pass', evaluate: () => true, progress: () => 1 },
        { type: 'test-fail', evaluate: () => false, progress: () => 0.4 },
        {
          type: 'metric-minimum',
          evaluate: () => false,
          progress: () => 0.5,
        },
      ],
    },
  })
}

describe('buildUnlockRequirementLeaves', () => {
  test('skips achievement-complete by default and visits Payload leaf rows with empty rules', async () => {
    installTestRules()
    const leaves = await buildUnlockRequirementLeaves({
      payload: { findByID: async () => null, find: async () => ({ docs: [] }) } as never,
      userId: 'u1',
      scopeId: 's1',
      rules: {
        combinator: 'and',
        rules: [
          { type: 'test-pass', combinator: 'and', rules: [] },
          { type: 'achievement-complete', achievementSlug: 'ring-grim', combinator: 'and', rules: [] },
          {
            type: 'metric-minimum',
            metric: { id: 'm1', name: 'Days as a member', slug: 'days-as-a-member' },
            minimum: 365,
            unit: 'days',
            since: 'membership-granted',
            combinator: 'and',
            rules: [],
          },
        ],
      },
    })

    expect(leaves.map((row) => row.type)).toEqual(['test-pass', 'metric-minimum'])
    expect(leaves[1]).toMatchObject({
      type: 'metric-minimum',
      met: false,
      progress: 0.5,
      target: 365,
      unit: 'days',
      since: 'membership-granted',
      relations: [
        {
          field: 'metric',
          collectionKey: 'metrics',
          id: 'm1',
          slug: 'days-as-a-member',
          name: 'Days as a member',
        },
      ],
    })
  })

  test('includes achievement-complete when asked', async () => {
    installTestRules()
    const payload = {
      find: async () => ({
        docs: [{ id: 'a1', slug: 'ring-grim', name: 'GRIM', eligibilityRules: [], completionRules: [] }],
      }),
      findByID: async () => null,
    }
    const leaves = await buildUnlockRequirementLeaves({
      payload: payload as never,
      userId: 'u1',
      scopeId: null,
      includeAchievementComplete: true,
      rules: [{ type: 'achievement-complete', achievementSlug: 'ring-grim' }],
    })
    expect(leaves).toHaveLength(1)
    expect(leaves[0]?.type).toBe('achievement-complete')
    expect(leaves[0]?.relations[0]).toMatchObject({
      field: 'achievement',
      slug: 'ring-grim',
    })
  })

  test('resolves catalog names by id when the relation is not populated', async () => {
    installTestRules()
    const payload = {
      findByID: async ({ id }: { id: string }) =>
        id === 'tier-1' ? { id: 'tier-1', name: 'Prospect', slug: 'ring-prospect' } : null,
      find: async () => ({ docs: [] }),
    }
    const leaves = await buildUnlockRequirementLeaves({
      payload: payload as never,
      userId: 'u1',
      scopeId: 's1',
      ladderRank: 0,
      rules: [{ type: 'test-fail', tier: 'tier-1' }],
    })
    expect(leaves[0]).toMatchObject({
      type: 'test-fail',
      met: false,
      progress: 0.4,
      relations: [{ field: 'tier', collectionKey: 'tiers', id: 'tier-1', slug: 'ring-prospect', name: 'Prospect' }],
    })
  })
})
