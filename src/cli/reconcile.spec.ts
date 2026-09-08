import { describe, expect, test } from 'bun:test'

import { parseReconcileCliArgs } from './reconcile'

describe('parseReconcileCliArgs', () => {
  test('reads user, scope, achievement, and tier flags', () => {
    expect(
      parseReconcileCliArgs([
        '--user=u1',
        '--scope',
        's1',
        '--achievement=ring-grim',
        '--tierId=t9',
        '--limit=25',
      ]),
    ).toEqual({
      userId: 'u1',
      scopeId: 's1',
      achievementId: undefined,
      achievementSlug: 'ring-grim',
      tierId: 't9',
      tierSlug: undefined,
      limit: 25,
    })
  })
})
