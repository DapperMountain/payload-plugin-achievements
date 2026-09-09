import { describe, expect, mock, test } from 'bun:test'

import { setAchievementOptions } from '../../options-store.js'
import { resolveTierProgress } from './resolveTierProgress.js'

describe('resolveTierProgress', () => {
  test('places the traveler between current and next from unlock progress', async () => {
    setAchievementOptions({
      extensions: {
        ruleTypes: [
          {
            type: 'test-half',
            evaluate: () => false,
            progress: () => 0.5,
          },
        ],
      },
    })

    const find = mock(async () => ({
      docs: [
        {
          id: 't0',
          name: 'Tier Zero',
          slug: 'tier-0',
          rank: 0,
          unlockRules: { combinator: 'and', rules: [] },
        },
        {
          id: 't1',
          name: 'Tier One',
          slug: 'tier-1',
          rank: 1,
          unlockRules: {
            combinator: 'and',
            rules: [{ type: 'test-half' }],
          },
        },
      ],
    }))

    // resolveCurrentTier will walk: empty rules → t0 unlocked; test-half fails → stop at t0
    const result = await resolveTierProgress({
      payload: { find, findByID: mock(async () => null) } as never,
      userId: 'u1',
      scopeId: 'p1',
    })

    expect(result.current?.id).toBe('t0')
    expect(result.next?.id).toBe('t1')
    expect(result.progressTowardNext).toBe(0.5)
    expect(result.ladderProgress).toBe(0.5)
  })
})
