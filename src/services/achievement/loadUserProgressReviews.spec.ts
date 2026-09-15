import { describe, expect, test } from 'bun:test'

import { loadUserProgressReviews } from './loadUserProgressReviews.js'

describe('loadUserProgressReviews', () => {
  test('collects pending achievement ids/slugs and open tier requests', async () => {
    const payload = {
      find: async ({ collection }: { collection: string }) => {
        if (String(collection).includes('request') && !String(collection).includes('tier')) {
          return {
            docs: [
              { achievement: { id: 'a1', slug: 'path-complete' } },
              { achievement: 'a2' },
            ],
          }
        }
        if (String(collection).includes('tier')) {
          return {
            docs: [
              { id: 'tr1', status: 'pending', tier: 't-veteran' },
              { id: 'tr2', status: 'rejected', tier: { id: 't-veteran' } },
              { id: 'tr3', status: 'approved', tier: 't-ignore' },
            ],
          }
        }
        return { docs: [] }
      },
    }

    const reviews = await loadUserProgressReviews({
      payload: payload as never,
      userId: 'u1',
      scopeId: 's1',
    })

    expect(reviews.pendingAchievementKeys.sort()).toEqual(['a1', 'a2', 'path-complete'])
    expect(reviews.tierRequests).toEqual([
      { id: 'tr1', status: 'pending', tierId: 't-veteran' },
      { id: 'tr2', status: 'rejected', tierId: 't-veteran' },
    ])
  })

  test('skips tier requests when unscoped', async () => {
    let collections: string[] = []
    const payload = {
      find: async ({ collection }: { collection: string }) => {
        collections.push(String(collection))
        return { docs: [] }
      },
    }

    const reviews = await loadUserProgressReviews({
      payload: payload as never,
      userId: 'u1',
      scopeId: null,
    })

    expect(reviews.tierRequests).toEqual([])
    expect(collections.some((slug) => slug.includes('tier'))).toBe(false)
  })
})
