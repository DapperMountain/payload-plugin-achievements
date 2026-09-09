import { beforeEach, describe, expect, test } from 'bun:test'

import { setAchievementOptions } from '../../options-store.js'
import { resolveOptions } from '../../defaults.js'
import { builtInRuleTypes } from './builtInRules.js'

const elapsed = builtInRuleTypes.find((rule) => rule.type === 'elapsed-since')!

describe('elapsed-since', () => {
  beforeEach(() => {
    setAchievementOptions(resolveOptions({ usersCollectionSlug: 'users' }))
  })

  test('passes when enough days have elapsed since user createdAt', async () => {
    const createdAt = new Date(Date.now() - 40 * 24 * 60 * 60 * 1000).toISOString()
    const payload = {
      findByID: async () => ({ id: 'u1', createdAt }),
    }

    const ok = await elapsed.evaluate({
      payload: payload as never,
      rule: { type: 'elapsed-since', since: 'user-created-at', amount: 30, unit: 'days' },
      userId: 'u1',
      scopeId: null,
    })
    expect(ok).toBe(true)

    const progress = await elapsed.progress!({
      payload: payload as never,
      rule: { type: 'elapsed-since', since: 'user-created-at', amount: 30, unit: 'days' },
      userId: 'u1',
      scopeId: null,
    })
    expect(progress).toBeGreaterThanOrEqual(1)
  })

  test('fails when not enough time has passed', async () => {
    const createdAt = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
    const payload = {
      findByID: async () => ({ id: 'u1', createdAt }),
    }

    const ok = await elapsed.evaluate({
      payload: payload as never,
      rule: { type: 'elapsed-since', since: 'user-created-at', amount: 30, unit: 'days' },
      userId: 'u1',
      scopeId: null,
    })
    expect(ok).toBe(false)

    const progress = await elapsed.progress!({
      payload: payload as never,
      rule: { type: 'elapsed-since', since: 'user-created-at', amount: 30, unit: 'days' },
      userId: 'u1',
      scopeId: null,
    })
    expect(progress).toBeGreaterThan(0)
    expect(progress).toBeLessThan(1)
  })

  test('uses earliest matching event log when since=first-event', async () => {
    const firstAt = new Date(Date.now() - 10 * 60 * 60 * 1000).toISOString()
    const payload = {
      find: async ({ collection }: { collection: string }) => {
        if (String(collection).includes('event-type') || String(collection).includes('eventTypes')) {
          return { docs: [{ id: 'et1', slug: 'joined' }] }
        }
        return { docs: [{ id: 'log1', createdAt: firstAt }] }
      },
    }

    const ok = await elapsed.evaluate({
      payload: payload as never,
      rule: {
        type: 'elapsed-since',
        since: 'first-event',
        eventType: 'et1',
        amount: 5,
        unit: 'hours',
      },
      userId: 'u1',
      scopeId: null,
    })
    expect(ok).toBe(true)
  })

  test('uses host metricAnchors when since is a custom key', async () => {
    setAchievementOptions(
      resolveOptions({
        usersCollectionSlug: 'users',
        extensions: {
          metricAnchors: {
            'membership-granted': async () => new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
          },
        },
      }),
    )

    const ok = await elapsed.evaluate({
      payload: { findByID: async () => null } as never,
      rule: { type: 'elapsed-since', since: 'membership-granted', amount: 7, unit: 'days' },
      userId: 'u1',
      scopeId: 'p1',
    })
    expect(ok).toBe(true)
  })
})
