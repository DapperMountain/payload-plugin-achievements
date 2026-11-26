import { describe, expect, test } from 'bun:test'
import { APIError } from 'payload'

import { resetAchievementOptions, setAchievementOptions } from '../../options-store.js'
import { findTierRequestsForReview, reviewTierRequest } from './reviewTierRequest.js'

describe('reviewTierRequest', () => {
  test('requires auth and canReview', async () => {
    resetAchievementOptions()
    setAchievementOptions({})
    await expect(
      reviewTierRequest({
        req: { user: null, payload: {} } as never,
        requestId: 'tr1',
        decision: 'approved',
      }),
    ).rejects.toBeInstanceOf(APIError)

    setAchievementOptions({
      canReview: async () => false,
    })
    await expect(
      reviewTierRequest({
        req: {
          user: { id: 'staff' },
          payload: {
            findByID: async () => ({ scope: 's1' }),
          },
        } as never,
        requestId: 'tr1',
        decision: 'approved',
      }),
    ).rejects.toMatchObject({ status: 403 })

    resetAchievementOptions()
  })

  test('updates status when the reviewer is allowed', async () => {
    resetAchievementOptions()
    setAchievementOptions({
      canReview: async () => true,
    })

    const updated = await reviewTierRequest({
      req: {
        user: { id: 'staff' },
        payload: {
          findByID: async () => ({ scope: null }),
          update: async ({ data }: { data: Record<string, unknown> }) => ({
            id: 'tr1',
            ...data,
          }),
        },
      } as never,
      requestId: 'tr1',
      decision: 'rejected',
      note: 'not yet',
    })

    expect(updated).toEqual({ id: 'tr1', status: 'rejected', note: 'not yet' })
    resetAchievementOptions()
  })
})

describe('findTierRequestsForReview', () => {
  test('lists pending requests for an allowed scope', async () => {
    resetAchievementOptions()
    setAchievementOptions({
      canReview: async (_user, scopeId) => scopeId === 's1',
    })

    const result = await findTierRequestsForReview({
      req: {
        user: { id: 'staff' },
        payload: {
          find: async (opts: { where?: unknown; collection?: string }) => {
            expect(opts.collection).toContain('tier')
            return { docs: [{ id: 'tr1', status: 'pending' }], totalDocs: 1 }
          },
        },
      } as never,
      scopeId: 's1',
    })

    expect(result.docs).toHaveLength(1)
    resetAchievementOptions()
  })

  test('forbids reviewers outside the scope', async () => {
    resetAchievementOptions()
    setAchievementOptions({
      canReview: async () => false,
    })

    await expect(
      findTierRequestsForReview({
        req: { user: { id: 'staff' }, payload: {} } as never,
        scopeId: 's1',
      }),
    ).rejects.toMatchObject({ status: 403 })

    resetAchievementOptions()
  })
})
