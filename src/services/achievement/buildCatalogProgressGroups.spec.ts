import { describe, expect, test } from 'bun:test'

import { buildCatalogProgressGroups } from './buildCatalogProgressGroups.js'

describe('buildCatalogProgressGroups', () => {
  test('orders children from completion rules and marks unearned rows', () => {
    const groups = buildCatalogProgressGroups({
      achievements: [
        {
          id: 'alpha',
          name: 'Alpha',
          slug: 'track-alpha',
          completionRules: { combinator: 'and', rules: [] },
        },
        {
          id: 'beta',
          name: 'Beta',
          slug: 'track-beta',
          completionRules: { combinator: 'and', rules: [] },
        },
        {
          id: 'parent',
          name: 'Track complete',
          slug: 'track-complete',
          description: 'Complete every child achievement.',
          completionRules: {
            combinator: 'and',
            rules: [
              { type: 'achievement-complete', achievement: 'alpha' },
              { type: 'achievement-complete', achievement: 'beta' },
            ],
          },
        },
      ],
      grants: [
        {
          id: 'g1',
          completedAt: '2026-09-03',
          achievement: { id: 'beta', slug: 'track-beta' },
        },
      ],
    })

    expect(groups).toHaveLength(1)
    expect(groups[0]?.title).toBe('Track complete')
    expect(groups[0]?.description).toBe('Complete every child achievement.')
    expect(groups[0]?.items.map((item) => item.slug)).toEqual(['track-alpha', 'track-beta'])
    expect(groups[0]?.items[0]?.earned).toBe(false)
    expect(groups[0]?.items[1]?.earned).toBe(true)
  })
})
