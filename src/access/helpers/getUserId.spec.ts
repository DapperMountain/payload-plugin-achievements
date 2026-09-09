import { describe, expect, test } from 'bun:test'
import type { PayloadRequest } from 'payload'

import { getUserId } from './index.js'

describe('getUserId', () => {
  test('reads string ids', () => {
    expect(getUserId({ user: { id: 'abc' } } as PayloadRequest)).toBe('abc')
  })

  test('stringifies numeric ids', () => {
    expect(getUserId({ user: { id: 42 } } as PayloadRequest)).toBe('42')
  })

  test('returns null without a user', () => {
    expect(getUserId({ user: null } as PayloadRequest)).toBeNull()
  })
})
