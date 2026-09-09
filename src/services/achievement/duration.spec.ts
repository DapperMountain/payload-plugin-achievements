import { describe, expect, test } from 'bun:test'

import { durationMs, elapsedUnits } from './duration.js'

describe('durationMs / elapsedUnits', () => {
  test('supports seconds through years', () => {
    expect(durationMs(2, 'seconds')).toBe(2_000)
    expect(durationMs(2, 'minutes')).toBe(120_000)
    expect(durationMs(2, 'hours')).toBe(7_200_000)
    expect(durationMs(2, 'days')).toBe(172_800_000)
    expect(durationMs(1, 'years')).toBe(365 * 24 * 60 * 60 * 1000)
    expect(durationMs(1, 'fortnights')).toBeNull()
  })

  test('elapsedUnits floors whole units', () => {
    const anchor = new Date('2020-01-01T00:00:00.000Z')
    const now = new Date('2020-01-01T00:00:02.500Z')
    expect(elapsedUnits(anchor, 'seconds', now)).toBe(2)
    expect(elapsedUnits(anchor, 'minutes', now)).toBe(0)
  })
})
