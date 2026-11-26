import { describe, expect, test } from 'bun:test'
import type { CollectionConfig } from 'payload'

import { applyCollectionOverrides } from './applyOverrides.js'

const pluginHook = () => undefined
const hostHook = () => undefined

function stubCollection(partial: Record<string, unknown>): CollectionConfig {
  return { slug: 'x', fields: [], ...partial } as unknown as CollectionConfig
}

describe('applyCollectionOverrides', () => {
  test('returns the collection unchanged without overrides', () => {
    const collection = stubCollection({
      slug: 'x',
      access: { read: () => true },
      hooks: { beforeValidate: [pluginHook] },
    })
    expect(applyCollectionOverrides(collection)).toBe(collection)
  })

  test('merges access so host keys win', () => {
    const hostRead = () => false
    const result = applyCollectionOverrides(
      stubCollection({
        slug: 'x',
        access: { read: () => true, create: () => true },
      }),
      { access: { read: hostRead } },
    )
    expect(result.access?.read).toBe(hostRead)
    expect(typeof result.access?.create).toBe('function')
  })

  test('appends host hooks after plugin hooks', () => {
    const result = applyCollectionOverrides(
      stubCollection({
        slug: 'x',
        hooks: { beforeValidate: [pluginHook], afterChange: [pluginHook] },
      }),
      { hooks: { beforeValidate: [hostHook] } },
    )
    expect(result.hooks?.beforeValidate).toEqual([pluginHook, hostHook])
    expect(result.hooks?.afterChange).toEqual([pluginHook])
  })

  test('merges admin shallowly', () => {
    const result = applyCollectionOverrides(
      stubCollection({
        slug: 'x',
        admin: { useAsTitle: 'id', defaultColumns: ['id'] },
      }),
      { admin: { description: 'Host copy' } },
    )
    expect(result.admin?.useAsTitle).toBe('id')
    expect(result.admin?.description).toBe('Host copy')
  })

  test('replaces fields from an array override', () => {
    const hostFields = [{ name: 'extra', type: 'text' as const }]
    const result = applyCollectionOverrides(
      stubCollection({
        slug: 'x',
        fields: [{ name: 'name', type: 'text' as const }],
      }),
      { fields: hostFields },
    )
    expect(result.fields).toEqual(hostFields)
  })

  test('wraps defaultFields when fields is a function', () => {
    const result = applyCollectionOverrides(
      stubCollection({
        slug: 'x',
        fields: [{ name: 'name', type: 'text' as const }],
      }),
      {
        fields: ({ defaultFields }) => [
          ...defaultFields,
          { name: 'hostNote', type: 'textarea' as const },
        ],
      },
    )
    expect(result.fields?.map((f) => ('name' in f ? f.name : undefined))).toEqual([
      'name',
      'hostNote',
    ])
  })
})
