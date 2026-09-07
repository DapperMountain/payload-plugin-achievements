import { describe, expect, test } from 'bun:test'

import { readEventTypeFlags } from './eventTypeRequiresActor'

describe('readEventTypeFlags', () => {
  test('reads requiresActor / requiresMetric', () => {
    expect(readEventTypeFlags({ requiresActor: true, requiresMetric: false })).toEqual({
      requiresActor: true,
      requiresMetric: false,
    })
  })

  test('treats metric.delta slug as requiresMetric', () => {
    expect(readEventTypeFlags({ slug: 'metric.delta' })).toEqual({
      requiresActor: false,
      requiresMetric: true,
    })
  })

  test('does not treat legacy metric.change slug as requiresMetric', () => {
    expect(readEventTypeFlags({ slug: 'metric.change' })).toEqual({
      requiresActor: false,
      requiresMetric: false,
    })
  })

  test('returns null for bare ids', () => {
    expect(readEventTypeFlags('only-an-id')).toBeNull()
  })
})
