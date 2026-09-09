import { describe, expect, test } from 'bun:test'

import { transitionLogData, transitionToId } from './logData'

describe('transitionLogData', () => {
  test('builds from/to refs for tier moves', () => {
    expect(
      transitionLogData({
        from: null,
        to: { id: 't1', slug: 'ring-prospect' },
      }),
    ).toEqual({
      from: null,
      to: { id: 't1', slug: 'ring-prospect' },
    })
  })

  test('omits empty slugs', () => {
    expect(transitionLogData({ from: { id: 'a', slug: '' }, to: { id: 'b' } })).toEqual({
      from: { id: 'a' },
      to: { id: 'b' },
    })
  })
})

describe('transitionToId', () => {
  test('reads new to.id and legacy tier/achievement ids', () => {
    expect(transitionToId({ to: { id: 'x', slug: 's' } })).toBe('x')
    expect(transitionToId({ tier: 'legacy-tier' })).toBe('legacy-tier')
    expect(transitionToId({ achievement: 'legacy-ach' })).toBe('legacy-ach')
    expect(transitionToId(null)).toBeNull()
  })
})
