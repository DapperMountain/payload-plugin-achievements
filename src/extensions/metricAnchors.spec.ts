import { describe, expect, test } from 'bun:test'

import { setAchievementOptions } from '../options-store.js'
import { resolveOptions } from '../defaults.js'
import { elapsedSinceSelectOptions } from './elapsedSinceOptions.js'

describe('elapsedSinceSelectOptions', () => {
  test('passes through Payload Admin labels for host anchors', () => {
    setAchievementOptions(
      resolveOptions({
        extensions: {
          metricAnchors: {
            'membership-granted': {
              label: {
                en: 'Product membership granted',
                es: 'Membresía del producto otorgada',
              },
              resolve: async () => null,
            },
            'first-purchase': async () => null,
          },
        },
      }),
    )

    const options = elapsedSinceSelectOptions()
    expect(options).toContainEqual({
      label: 'User created at',
      value: 'user-created-at',
    })
    expect(options).toContainEqual({
      label: {
        en: 'Product membership granted',
        es: 'Membresía del producto otorgada',
      },
      value: 'membership-granted',
    })
    // Bare resolver: key until the host supplies a label.
    expect(options).toContainEqual({
      label: 'first-purchase',
      value: 'first-purchase',
    })
  })
})
