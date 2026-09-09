import { describe, expect, mock, test } from 'bun:test'

import { setAchievementOptions } from '../../options-store.js'
import { reconcileProgression } from './reconcile.js'

function mockPayload(findImpl: (args: { collection: string }) => { docs: unknown[] }) {
  const find = mock(async (args: { collection: string }) => {
    if (args.collection === 'achievement-event-types') {
      return { docs: [{ id: 'et-granted', slug: 'achievement.granted' }] }
    }
    return findImpl(args)
  })
  return {
    find,
    findByID: mock(async ({ id }: { id: string }) =>
      id === 'et-granted' ? { id: 'et-granted', slug: 'achievement.granted' } : null,
    ),
    create: mock(async () => ({ id: 'x' })),
  }
}

describe('reconcileProgression filters', () => {
  test('limits to a single user when userId is set', async () => {
    setAchievementOptions({})

    const result = await reconcileProgression({
      payload: mockPayload(() => ({ docs: [] })) as never,
      userId: 'user-1',
      scopeId: 'scope-1',
    })

    expect(result.usersScanned).toBe(1)
  })

  test('discovers pairs from achievement requests by slug', async () => {
    setAchievementOptions({})

    const result = await reconcileProgression({
      payload: mockPayload(({ collection }) => {
        if (collection === 'achievement-definitions') {
          return { docs: [{ id: 'ach-1', slug: 'ring-grim' }] }
        }
        if (collection === 'achievement-grants') {
          return { docs: [] }
        }
        if (collection === 'achievement-requests') {
          return {
            docs: [{ id: 'req-1', user: 'user-2', scope: 'scope-2', achievement: 'ach-1' }],
          }
        }
        return { docs: [] }
      }) as never,
      achievementSlug: 'ring-grim',
    })

    expect(result.usersScanned).toBe(1)
  })
})
