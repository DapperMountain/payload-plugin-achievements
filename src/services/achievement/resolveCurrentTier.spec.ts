import { describe, expect, mock, test } from 'bun:test'

import { setAchievementOptions } from '../../options-store'
import { resolveCurrentTier } from './resolveCurrentTier'

describe('resolveCurrentTier', () => {
  test('walks ranks and keeps the highest unlocked tier', async () => {
    setAchievementOptions({})

    const find = mock(async () => ({
      docs: [
        { id: 't0', name: 'Tier Zero', slug: 'tier-0', rank: 0, unlockRules: { combinator: 'and', rules: [] } },
        {
          id: 't1',
          name: 'Tier One',
          slug: 'tier-1',
          rank: 1,
          unlockRules: {
            combinator: 'and',
            rules: [{ type: 'tier-at-least', tier: 't0' }],
          },
        },
      ],
    }))

    const findByID = mock(async ({ id }: { id: string }) => {
      if (id === 't0') return { id: 't0', rank: 0 }
      return null
    })

    const tier = await resolveCurrentTier({
      payload: { find, findByID } as never,
      userId: 'u1',
      scopeId: 'p1',
    })

    expect(tier?.id).toBe('t1')
    expect(tier?.slug).toBe('tier-1')
    expect(tier?.rank).toBe(1)
  })
})
