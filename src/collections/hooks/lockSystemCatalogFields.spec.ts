import { describe, expect, test } from 'bun:test'

import { lockSystemCatalogFields } from './lockSystemCatalogFields.js'

describe('lockSystemCatalogFields', () => {
  test('locks slug and system on system row updates', () => {
    const result = lockSystemCatalogFields({
      data: { slug: 'hacked', system: false, name: 'X' },
      originalDoc: { slug: 'points', system: true },
      operation: 'update',
    } as never)
    expect(result).toEqual({ slug: 'points', system: true, name: 'X' })
  })

  test('leaves non-system updates alone', () => {
    const data = { slug: 'custom', system: false }
    const result = lockSystemCatalogFields({
      data,
      originalDoc: { slug: 'custom', system: false },
      operation: 'update',
    } as never)
    expect(result).toEqual(data)
  })
})
