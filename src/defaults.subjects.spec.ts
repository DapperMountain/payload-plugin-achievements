import { describe, expect, test } from 'bun:test'

import {
  resolveOptions,
  resolveSubjectCollections,
  resolveSubjectCollectionsFromConfig,
} from './defaults.js'
import { getAchievementOptions, resetAchievementOptions, setAchievementOptions } from './options-store.js'

describe('resolveOptions subjects', () => {
  test('keeps subjectCollections when resolveOptions is applied twice', () => {
    const once = resolveOptions({ subjects: { collections: ['posts', 'comments'] } })
    const twice = resolveOptions(once)
    expect(once.subjectCollections).toEqual(['posts', 'comments'])
    expect(twice.subjectCollections).toEqual(['posts', 'comments'])
  })

  test('setAchievementOptions(resolveOptions(...)) still exposes subjects to collections', () => {
    resetAchievementOptions()
    setAchievementOptions(resolveOptions({ subjects: { collections: ['posts'] } }))
    expect(getAchievementOptions().subjectCollections).toEqual(['posts'])
    resetAchievementOptions()
  })

  test('does not treat collections: "all" as the characters a, l, l', () => {
    expect(resolveSubjectCollections({ subjects: { collections: 'all' } })).toEqual([])
    expect(resolveOptions({ subjects: { collections: 'all' } }).subjectCollections).toEqual([])
  })

  test('resolveSubjectCollectionsFromConfig("all") takes host slugs minus plugin and payload-*', () => {
    const slugs = resolveSubjectCollectionsFromConfig(
      { subjects: { collections: 'all' }, collections: { prefix: 'achievement' } },
      {
        collections: [
          { slug: 'posts', fields: [] },
          { slug: 'users', fields: [] },
          { slug: 'payload-locked-documents', fields: [] },
          { slug: 'payload-preferences', fields: [] },
          { slug: 'achievement-logs', fields: [] },
          { slug: 'media', fields: [] },
        ],
      },
    )
    expect(slugs).toEqual(['posts', 'users', 'media'])
  })

  test('resolveSubjectCollectionsFromConfig passes through an explicit list', () => {
    expect(
      resolveSubjectCollectionsFromConfig(
        { subjects: { collections: ['posts', 'posts', ' comments '] } },
        { collections: [{ slug: 'ignored', fields: [] }] },
      ),
    ).toEqual(['posts', 'comments'])
  })
})
