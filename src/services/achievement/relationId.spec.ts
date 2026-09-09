import { describe, expect, test } from 'bun:test'

import { relationId } from './relationId.js'

describe('relationId', () => {
  test('accepts string and number ids', () => {
    expect(relationId('x')).toBe('x')
    expect(relationId(7)).toBe('7')
  })

  test('reads nested relationship objects', () => {
    expect(relationId({ id: 'rel' })).toBe('rel')
    expect(relationId({ id: 9 })).toBe('9')
  })

  test('returns null for empty values', () => {
    expect(relationId(null)).toBeNull()
    expect(relationId('')).toBeNull()
    expect(relationId({})).toBeNull()
  })
})
