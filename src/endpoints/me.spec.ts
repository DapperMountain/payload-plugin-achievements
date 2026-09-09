import { describe, expect, test } from 'bun:test'

import {
  DEFAULT_ME_ENDPOINT_PATH,
  DEFAULT_RECONCILE_ENDPOINT_PATH,
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

describe('resolveReconcileEndpointPath', () => {
  test('defaults to /achievements/reconcile', () => {
    expect(resolveReconcileEndpointPath()).toBe(DEFAULT_RECONCILE_ENDPOINT_PATH)
  })

  test('can be disabled', () => {
    expect(resolveReconcileEndpointPath(false)).toBe(false)
  })
})

describe('buildAchievementEndpoints', () => {
  test('registers me and reconcile by default', () => {
    const endpoints = buildAchievementEndpoints(resolveOptions({}))
    expect(endpoints).toHaveLength(2)
    expect(endpoints[0]?.path).toBe('/achievements/me')
    expect(endpoints[0]?.method).toBe('get')
    expect(endpoints[1]?.path).toBe('/achievements/reconcile')
    expect(endpoints[1]?.method).toBe('post')
  })

  test('skips me when disabled', () => {
    const endpoints = buildAchievementEndpoints(resolveOptions({ endpoints: { me: false } }))
    expect(endpoints).toHaveLength(1)
    expect(endpoints[0]?.path).toBe('/achievements/reconcile')
  })

  test('skips reconcile when disabled', () => {
    const endpoints = buildAchievementEndpoints(resolveOptions({ endpoints: { reconcile: false } }))
    expect(endpoints).toHaveLength(1)
    expect(endpoints[0]?.path).toBe('/achievements/me')
  })

  test('uses a custom me path', () => {
    const endpoints = buildAchievementEndpoints(
      resolveOptions({ endpoints: { me: '/progress/me', reconcile: false } }),
    )
    expect(endpoints[0]?.path).toBe('/progress/me')
  })
})
