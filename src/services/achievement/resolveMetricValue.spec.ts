import { beforeEach, describe, expect, test } from 'bun:test'

import { setAchievementOptions } from '../../options-store.js'
import { resolveOptions } from '../../defaults.js'
import { resolveMetricValue } from './resolveMetricValue.js'
import { builtInRuleTypes } from './builtInRules.js'

const metricMinimum = builtInRuleTypes.find((rule) => rule.type === 'metric-minimum')!

describe('resolveMetricValue', () => {
  beforeEach(() => {
    setAchievementOptions(
      resolveOptions({
        usersCollectionSlug: 'users',
        extensions: {
          metricAnchors: {
            'membership-granted': async () => new Date(Date.now() - 40 * 24 * 60 * 60 * 1000),
          },
        },
      }),
    )
  })

  test('stored metric reads balance value', async () => {
    const payload = {
      find: async ({ collection, where }: { collection: string; where?: unknown }) => {
        if (String(collection).includes('metric-balance') || String(collection).includes('metricBalances')) {
          return { docs: [{ id: 'b1', value: 42 }] }
        }
        if (String(collection).includes('metric')) {
          return { docs: [{ id: 'm1', slug: 'points', kind: 'stored' }] }
        }
        return { docs: [] }
      },
      findByID: async () => null,
    }

    const value = await resolveMetricValue({
      payload: payload as never,
      metric: 'points',
      userId: 'u1',
      scopeId: null,
    })
    expect(value).toBe(42)
  })

  test('computed elapsed uses host metricAnchors', async () => {
    const payload = {
      find: async () => ({
        docs: [
          {
            id: 'm-days',
            slug: 'days',
            kind: 'computed',
            compute: 'elapsed',
            unit: 'days',
            since: 'membership-granted',
          },
        ],
      }),
      findByID: async () => null,
    }

    const value = await resolveMetricValue({
      payload: payload as never,
      metric: 'days',
      userId: 'u1',
      scopeId: 'prod-1',
      now: new Date(),
    })
    expect(value).toBeGreaterThanOrEqual(40)
  })

  test('missing host anchor yields 0', async () => {
    setAchievementOptions(resolveOptions({ usersCollectionSlug: 'users' }))
    const payload = {
      find: async () => ({
        docs: [
          {
            id: 'm-days',
            slug: 'days',
            kind: 'computed',
            compute: 'elapsed',
            unit: 'days',
            since: 'membership-granted',
          },
        ],
      }),
      findByID: async () => null,
    }

    const value = await resolveMetricValue({
      payload: payload as never,
      metric: 'days',
      userId: 'u1',
      scopeId: null,
    })
    expect(value).toBe(0)
  })
})

describe('metric-minimum with computed metric', () => {
  beforeEach(() => {
    setAchievementOptions(
      resolveOptions({
        usersCollectionSlug: 'users',
        extensions: {
          metricAnchors: {
            'membership-granted': async () => new Date(Date.now() - 40 * 24 * 60 * 60 * 1000),
          },
        },
      }),
    )
  })

  test('passes when computed days meet minimum', async () => {
    const payload = {
      find: async ({ where }: { where?: { slug?: { equals?: string } } }) => {
        if (where && 'slug' in (where as object)) {
          return {
            docs: [
              {
                id: 'm-days',
                slug: 'days',
                kind: 'computed',
                compute: 'elapsed',
                unit: 'days',
                since: 'membership-granted',
              },
            ],
          }
        }
        return {
          docs: [
            {
              id: 'm-days',
              slug: 'days',
              kind: 'computed',
              compute: 'elapsed',
              unit: 'days',
              since: 'membership-granted',
            },
          ],
        }
      },
      findByID: async ({ id }: { id: string }) => {
        if (id === 'm-days') {
          return {
            id: 'm-days',
            slug: 'days',
            kind: 'computed',
            compute: 'elapsed',
            unit: 'days',
            since: 'membership-granted',
          }
        }
        return null
      },
    }

    const ok = await metricMinimum.evaluate({
      payload: payload as never,
      rule: { type: 'metric-minimum', metricSlug: 'days', minimum: 30 },
      userId: 'u1',
      scopeId: 'prod-1',
    })
    expect(ok).toBe(true)
  })
})
