import { describe, expect, test } from 'bun:test'

import { didDisableRequiresReview } from './releaseReviewGate.js'

describe('didDisableRequiresReview', () => {
  test('true only when flipping required → not required', () => {
    expect(didDisableRequiresReview({ requiresReview: true }, { requiresReview: false })).toBe(true)
    expect(didDisableRequiresReview({ requiresReview: true }, { requiresReview: null })).toBe(true)
    expect(didDisableRequiresReview({ requiresReview: true }, {})).toBe(true)
  })

  test('false for other transitions', () => {
    expect(didDisableRequiresReview({ requiresReview: false }, { requiresReview: true })).toBe(false)
    expect(didDisableRequiresReview({ requiresReview: true }, { requiresReview: true })).toBe(false)
    expect(didDisableRequiresReview({ requiresReview: false }, { requiresReview: false })).toBe(false)
    expect(didDisableRequiresReview(undefined, { requiresReview: false })).toBe(false)
  })
})
