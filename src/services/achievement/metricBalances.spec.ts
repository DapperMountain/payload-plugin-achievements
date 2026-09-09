import { beforeEach, describe, expect, test } from 'bun:test'
import { APIError } from 'payload'

import { setAchievementOptions } from '../../options-store.js'
import { resolveOptions } from '../../defaults.js'
import { applyMetricBalanceDelta, metricBalanceKey, rebuildMetricBalance } from './metricBalances.js'
import { getMetricLeaderboard } from './getMetricLeaderboard.js'
import { recordMetricChange } from './recordEvent.js'

describe('metricBalances', () => {
  beforeEach(() => {
    setAchievementOptions(resolveOptions({ usersCollectionSlug: 'users' }))
  })

  test('metricBalanceKey is stable', () => {
    expect(metricBalanceKey('u1', null, 'm1')).toBe('u1::m1')
    expect(metricBalanceKey('u1', 's1', 'm1')).toBe('u1:s1:m1')
  })

  test('applyMetricBalanceDelta creates then increments', async () => {
    const store: Array<{ id: string; key: string; value: number }> = []
    const payload = {
      find: async ({ where }: { where?: { key?: { equals?: string } } }) => {
        const key = where?.key?.equals
        return { docs: store.filter((row) => row.key === key) }
      },
      create: async ({ data }: { data: { key: string; value: number } }) => {
        const row = { id: `b${store.length + 1}`, key: data.key, value: data.value }
        store.push(row)
        return row
      },
      update: async ({ id, data }: { id: string; data: { value: number } }) => {
        const row = store.find((r) => r.id === id)!
        row.value = data.value
        return row
      },
    }

    const first = await applyMetricBalanceDelta({
      payload: payload as never,
      userId: 'u1',
      scopeId: null,
      metricId: 'm1',
      change: 10,
    })
    expect(first.value).toBe(10)

    const second = await applyMetricBalanceDelta({
      payload: payload as never,
      userId: 'u1',
      scopeId: null,
      metricId: 'm1',
      change: 5,
    })
    expect(second.value).toBe(15)
  })

  test('rebuildMetricBalance sums log changes', async () => {
    const store: Array<{ id: string; key: string; value: number }> = []
    const payload = {
      find: async ({ collection, where }: { collection: string; where?: unknown }) => {
        if (String(collection).includes('log')) {
          return {
            docs: [
              { change: 10, metric: 'm1' },
              { change: 7, metric: 'm1' },
              { change: -2, metric: 'm1' },
            ],
          }
        }
        const key = (where as { key?: { equals?: string } })?.key?.equals
        return { docs: store.filter((row) => row.key === key) }
      },
      create: async ({ data }: { data: { key: string; value: number } }) => {
        const row = { id: 'b1', key: data.key, value: data.value }
        store.push(row)
        return row
      },
      update: async () => ({ id: 'b1' }),
    }

    const result = await rebuildMetricBalance({
      payload: payload as never,
      userId: 'u1',
      scopeId: null,
      metricId: 'm1',
    })
    expect(result.value).toBe(15)
  })
})

describe('recordMetricChange', () => {
  beforeEach(() => {
    setAchievementOptions(resolveOptions({ usersCollectionSlug: 'users' }))
  })

  test('rejects computed metrics', async () => {
    const payload = {
      find: async () => ({
        docs: [{ id: 'm-days', slug: 'days', kind: 'computed', compute: 'elapsed' }],
      }),
      findByID: async () => null,
      create: async () => {
        throw new Error('should not create')
      },
    }

    await expect(
      recordMetricChange({
        payload: payload as never,
        userId: 'u1',
        metric: 'days',
        change: 1,
      }),
    ).rejects.toBeInstanceOf(APIError)
  })
})

describe('getMetricLeaderboard', () => {
  beforeEach(() => {
    setAchievementOptions(resolveOptions({ usersCollectionSlug: 'users' }))
  })

  test('orders by value and assigns ranks', async () => {
    const payload = {
      find: async ({ collection, page }: { collection: string; page?: number }) => {
        if (String(collection).includes('metric') && !String(collection).includes('balance')) {
          return { docs: [{ id: 'm1', slug: 'points', kind: 'stored' }] }
        }
        return {
          docs: [
            { id: 'b1', user: 'u2', value: 50 },
            { id: 'b2', user: 'u1', value: 20 },
          ],
          totalDocs: 2,
          page: page ?? 1,
          totalPages: 1,
        }
      },
      findByID: async () => null,
    }

    const board = await getMetricLeaderboard({
      payload: payload as never,
      metric: 'points',
      limit: 10,
      page: 1,
    })
    expect(board.docs[0]).toEqual({ user: 'u2', value: 50, rank: 1 })
    expect(board.docs[1]).toEqual({ user: 'u1', value: 20, rank: 2 })
  })

  test('rejects computed metrics', async () => {
    const payload = {
      find: async () => ({
        docs: [{ id: 'm-days', slug: 'days', kind: 'computed' }],
      }),
      findByID: async () => null,
    }

    await expect(
      getMetricLeaderboard({
        payload: payload as never,
        metric: 'days',
      }),
    ).rejects.toBeInstanceOf(APIError)
  })
})
