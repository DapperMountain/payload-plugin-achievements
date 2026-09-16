import { describe, expect, test } from 'bun:test'

import { isGrantAuditEventSlug } from '../../catalog.js'
import { reactionMatchWhere } from './runReactions.js'

describe('isGrantAuditEventSlug', () => {
  test('matches grant/revoke audit types only', () => {
    expect(isGrantAuditEventSlug('achievement.granted')).toBe(true)
    expect(isGrantAuditEventSlug('achievement.revoked')).toBe(true)
    expect(isGrantAuditEventSlug('metric.delta')).toBe(false)
    expect(isGrantAuditEventSlug('tier.changed')).toBe(false)
    expect(isGrantAuditEventSlug('post.published')).toBe(false)
    expect(isGrantAuditEventSlug(null)).toBe(false)
  })
})

describe('reactionMatchWhere', () => {
  test('returns null without the matching catalog id', () => {
    expect(reactionMatchWhere({ trigger: 'event', scopeId: null })).toBeNull()
    expect(reactionMatchWhere({ trigger: 'achievement.granted', scopeId: 's1' })).toBeNull()
  })

  test('matches enabled event reactions for a type, including unscoped rows when scoped', () => {
    expect(
      reactionMatchWhere({
        trigger: 'event',
        scopeId: 's1',
        eventTypeId: 'et-1',
      }),
    ).toEqual({
      and: [
        { enabled: { equals: true } },
        { trigger: { equals: 'event' } },
        { eventType: { equals: 'et-1' } },
        {
          or: [{ scope: { equals: 's1' } }, { scope: { exists: false } }, { scope: { equals: null } }],
        },
      ],
    })
  })

  test('requires no scope on the reaction when the event is unscoped', () => {
    expect(
      reactionMatchWhere({
        trigger: 'achievement.revoked',
        scopeId: null,
        achievementId: 'a-1',
      }),
    ).toEqual({
      and: [
        { enabled: { equals: true } },
        { trigger: { equals: 'achievement.revoked' } },
        { achievement: { equals: 'a-1' } },
        { or: [{ scope: { exists: false } }, { scope: { equals: null } }] },
      ],
    })
  })
})
