import { describe, expect, test } from 'bun:test'

import { resolveOptions } from './defaults.js'
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
})
