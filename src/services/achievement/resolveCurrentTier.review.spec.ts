import { describe, expect, mock, test } from 'bun:test'

import { setAchievementOptions } from '../../options-store.js'
import { resolveCurrentTier } from './resolveCurrentTier.js'

describe('resolveCurrentTier requiresReview', () => {
  test('stops before a review-required tier without an approved request', async () => {
    setAchievementOptions({})

    const find = mock(async ({ collection }: { collection: string }) => {
      if (String(collection).includes('tier-request') || collection === 'achievement-tier-requests') {
        return { docs: [] }
      }
      return {
        docs: [
          { id: 't0', name: 'Tier Zero', slug: 'tier-0', rank: 0, unlockRules: { combinator: 'and', rules: [] } },
          {
            id: 't1',
            name: 'Tier One',
            slug: 'tier-1',
            rank: 1,
            requiresReview: true,
            unlockRules: {
              combinator: 'and',
              rules: [{ type: 'tier-at-least', tier: 't0' }],
            },
          },
        ],
      }
    })

    const findByID = mock(async ({ id }: { id: string }) => {
      if (id === 't0') return { id: 't0', rank: 0 }
      return null
    })

    const tier = await resolveCurrentTier({
      payload: { find, findByID } as never,
      userId: 'u1',
      scopeId: 's1',
    })

    expect(tier?.id).toBe('t0')
    expect(tier?.slug).toBe('tier-0')
  })
})
