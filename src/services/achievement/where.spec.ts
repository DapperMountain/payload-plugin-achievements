import { describe, expect, test } from 'bun:test'

import { userScopeIncludingUnscopedWhere, userScopeWhere } from './where.js'

describe('userScopeWhere', () => {
  test('filters by user alone when scope is null', () => {
    expect(userScopeWhere('u1', null)).toEqual({
      and: [{ user: { equals: 'u1' } }],
    })
  })

  test('adds scope when provided', () => {
    expect(userScopeWhere('u1', 'scope-a')).toEqual({
      and: [{ user: { equals: 'u1' } }, { scope: { equals: 'scope-a' } }],
    })
  })
})

describe('userScopeIncludingUnscopedWhere', () => {
  test('matches userScopeWhere when scope is null', () => {
    expect(userScopeIncludingUnscopedWhere('u1', null)).toEqual(userScopeWhere('u1', null))
  })

  test('includes matching scope or empty scope when scoped', () => {
    expect(userScopeIncludingUnscopedWhere('u1', 'scope-a')).toEqual({
      and: [
        { user: { equals: 'u1' } },
        {
          or: [
            { scope: { equals: 'scope-a' } },
            { scope: { exists: false } },
            { scope: { equals: null } },
          ],
        },
      ],
    })
  })
})
