import { describe, expect, test } from 'bun:test'

import { DEFAULT_ME_ENDPOINT_PATH, resolveMeEndpointPath, resolveOptions } from '../defaults'
import { buildAchievementEndpoints } from './index'

describe('resolveMeEndpointPath', () => {
  test('defaults to /achievements/me', () => {
    expect(resolveMeEndpointPath()).toBe(DEFAULT_ME_ENDPOINT_PATH)
    expect(resolveMeEndpointPath(undefined)).toBe('/achievements/me')
  })

  test('normalizes missing leading slash', () => {
    expect(resolveMeEndpointPath('progress/me')).toBe('/progress/me')
  })

  test('can be disabled', () => {
    expect(resolveMeEndpointPath(false)).toBe(false)
  })
})

describe('buildAchievementEndpoints', () => {
  test('registers the me route by default', () => {
    const endpoints = buildAchievementEndpoints(resolveOptions({}))
    expect(endpoints).toHaveLength(1)
    expect(endpoints[0]?.path).toBe('/achievements/me')
    expect(endpoints[0]?.method).toBe('get')
  })

  test('skips me when disabled', () => {
    expect(buildAchievementEndpoints(resolveOptions({ endpoints: { me: false } }))).toEqual([])
  })

  test('uses a custom path', () => {
    const endpoints = buildAchievementEndpoints(
      resolveOptions({ endpoints: { me: '/ring/progress/me' } }),
    )
    expect(endpoints[0]?.path).toBe('/ring/progress/me')
  })
})
