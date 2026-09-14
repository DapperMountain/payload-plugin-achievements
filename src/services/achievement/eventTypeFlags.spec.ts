import { describe, expect, test } from 'bun:test'

import { readEventTypeFlags } from './eventTypeRequiresActor.js'

describe('readEventTypeFlags', () => {
  test('reads requiresActor / requiresMetric / requiresSubject', () => {
    expect(
      readEventTypeFlags({
        requiresActor: true,
        requiresMetric: false,
        requiresSubject: true,
        subjectRelationTo: ['comments'],
      }),
    ).toEqual({
      requiresActor: true,
      requiresMetric: false,
      requiresSubject: true,
      subjectRelationTo: ['comments'],
    })
  })

  test('treats metric.delta slug as requiresMetric', () => {
    expect(readEventTypeFlags({ slug: 'metric.delta' })).toEqual({
      requiresActor: false,
      requiresMetric: true,
      requiresSubject: false,
      subjectRelationTo: [],
    })
  })

  test('does not treat legacy metric.change slug as requiresMetric', () => {
    expect(readEventTypeFlags({ slug: 'metric.change' })).toEqual({
      requiresActor: false,
      requiresMetric: false,
      requiresSubject: false,
      subjectRelationTo: [],
    })
  })

  test('returns null for bare ids', () => {
    expect(readEventTypeFlags('only-an-id')).toBeNull()
  })
})
