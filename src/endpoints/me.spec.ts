import { describe, expect, test } from 'bun:test'

import {
  DEFAULT_LEADERBOARD_ENDPOINT_PATH,
  DEFAULT_ME_ENDPOINT_PATH,
  DEFAULT_RECONCILE_ENDPOINT_PATH,
  resolveLeaderboardEndpointPath,
  resolveMeEndpointPath,
  resolveOptions,
  resolveReconcileEndpointPath,
} from '../defaults.js'
import { buildAchievementEndpoints } from './index.js'

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

describe('resolveLeaderboardEndpointPath', () => {
  test('defaults to /achievements/leaderboard', () => {
    expect(resolveLeaderboardEndpointPath()).toBe(DEFAULT_LEADERBOARD_ENDPOINT_PATH)
  })

  test('can be disabled', () => {
    expect(resolveLeaderboardEndpointPath(false)).toBe(false)
  })
})

describe('resolveReconcileEndpointPath', () => {
  test('defaults to /achievements/reconcile', () => {
    expect(resolveReconcileEndpointPath()).toBe(DEFAULT_RECONCILE_ENDPOINT_PATH)
  })

  test('can be disabled', () => {
    expect(resolveReconcileEndpointPath(false)).toBe(false)
  })
})

describe('buildAchievementEndpoints', () => {
  test('registers me, leaderboard, and reconcile by default', () => {
    const endpoints = buildAchievementEndpoints(resolveOptions({}))
    expect(endpoints).toHaveLength(3)
    expect(endpoints[0]?.path).toBe('/achievements/me')
    expect(endpoints[0]?.method).toBe('get')
    expect(endpoints[1]?.path).toBe('/achievements/leaderboard')
    expect(endpoints[1]?.method).toBe('get')
    expect(endpoints[2]?.path).toBe('/achievements/reconcile')
    expect(endpoints[2]?.method).toBe('post')
  })

  test('skips me when disabled', () => {
    const endpoints = buildAchievementEndpoints(resolveOptions({ endpoints: { me: false } }))
    expect(endpoints.map((e) => e.path)).toEqual([
      '/achievements/leaderboard',
      '/achievements/reconcile',
    ])
  })

  test('skips leaderboard when disabled', () => {
    const endpoints = buildAchievementEndpoints(
      resolveOptions({ endpoints: { leaderboard: false } }),
    )
    expect(endpoints.map((e) => e.path)).toEqual(['/achievements/me', '/achievements/reconcile'])
  })

  test('skips reconcile when disabled', () => {
    const endpoints = buildAchievementEndpoints(resolveOptions({ endpoints: { reconcile: false } }))
    expect(endpoints.map((e) => e.path)).toEqual([
      '/achievements/me',
      '/achievements/leaderboard',
    ])
  })

  test('uses a custom me path', () => {
    const endpoints = buildAchievementEndpoints(
      resolveOptions({ endpoints: { me: '/progress/me', reconcile: false, leaderboard: false } }),
    )
    expect(endpoints[0]?.path).toBe('/progress/me')
  })
})
