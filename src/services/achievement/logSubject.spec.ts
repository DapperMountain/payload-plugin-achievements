import { describe, expect, test } from 'bun:test'

import { logSubject, readLogSubject } from './logSubject.js'

describe('readLogSubject', () => {
  test('reads relationTo + value id', () => {
    expect(readLogSubject({ relationTo: 'comments', value: 'c1' })).toEqual({
      relationTo: 'comments',
      value: 'c1',
    })
  })

  test('reads nested value.id', () => {
    expect(readLogSubject({ relationTo: 'posts', value: { id: 'p1' } })).toEqual({
      relationTo: 'posts',
      value: 'p1',
    })
  })

  test('returns null for incomplete shapes', () => {
    expect(readLogSubject(null)).toBeNull()
    expect(readLogSubject({ relationTo: 'comments' })).toBeNull()
    expect(readLogSubject({ value: 'c1' })).toBeNull()
    expect(readLogSubject('c1')).toBeNull()
  })
})

describe('logSubject', () => {
  test('builds a ref', () => {
    expect(logSubject('endorsements', 'e1')).toEqual({
      relationTo: 'endorsements',
      value: 'e1',
    })
  })
})
