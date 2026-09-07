import { afterEach, describe, expect, test } from 'bun:test'
import type { AccessArgs, PayloadRequest } from 'payload'

import { isReviewer } from './index'
import { resetAchievementOptions, setAchievementOptions } from '../../options-store'

afterEach(() => {
  resetAchievementOptions()
})

function reqWithUser(id = 'u1'): PayloadRequest {
  return { user: { id } } as PayloadRequest
}

describe('isReviewer', () => {
  test('denies when canReview is unset', async () => {
    setAchievementOptions({})
    const allowed = await isReviewer()({ req: reqWithUser() } as AccessArgs)
    expect(allowed).toBe(false)
  })

  test('denies unauthenticated users even when canReview is set', async () => {
    setAchievementOptions({ canReview: () => true })
    const allowed = await isReviewer()({ req: { user: null } as PayloadRequest } as AccessArgs)
    expect(allowed).toBe(false)
  })

  test('passes scope from data to canReview', async () => {
    const seen: Array<string | null> = []
    setAchievementOptions({
      canReview: (_user, scopeId) => {
        seen.push(scopeId)
        return scopeId === 'scope-a'
      },
    })

    expect(
      await isReviewer()({
        req: reqWithUser(),
        data: { scope: 'scope-a' },
      } as AccessArgs),
    ).toBe(true)

    expect(
      await isReviewer()({
        req: reqWithUser(),
        data: { scope: 'scope-b' },
      } as AccessArgs),
    ).toBe(false)

    expect(seen).toEqual(['scope-a', 'scope-b'])
  })

  test('loads scope from existing doc when updating by id', async () => {
    const seen: Array<string | null> = []
    setAchievementOptions({
      canReview: (_user, scopeId) => {
        seen.push(scopeId)
        return true
      },
    })

    const findByID = async () => ({ scope: 'scope-from-db' })
    const allowed = await isReviewer('achievementRequests')({
      req: {
        user: { id: 'u1' },
        payload: { findByID },
      } as unknown as PayloadRequest,
      id: 'req-1',
    } as AccessArgs)

    expect(allowed).toBe(true)
    expect(seen).toEqual(['scope-from-db'])
  })
})
