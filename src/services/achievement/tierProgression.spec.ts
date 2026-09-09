import { describe, expect, mock, test } from 'bun:test'

import { setAchievementOptions } from '../../options-store.js'
import { ensureTierRequest } from './tierProgression.js'

describe('ensureTierRequest', () => {
  test('does not create a new pending request when only a rejected row exists', async () => {
    setAchievementOptions({})

    const rejectedDoc = {
      id: 'tr1',
      status: 'rejected',
      user: 'u1',
      tier: 't1',
    }

    const find = mock(async ({ where }: { where?: { and?: Array<Record<string, unknown>> } }) => {
      const statusClause = where?.and?.find((clause) => 'status' in clause)?.status as
        | { in?: string[]; equals?: string }
        | undefined
      if (statusClause?.in) return { docs: [] }
      if (statusClause?.equals === 'rejected') return { docs: [rejectedDoc] }
      return { docs: [] }
    })
    const create = mock(async () => {
      throw new Error('should not create')
    })

    const result = await ensureTierRequest({
      req: {
        payload: { find, create },
        context: {},
      } as never,
      userId: 'u1',
      tierId: 't1',
      scopeId: 's1',
    })

    expect(result.created).toBe(false)
    expect(result.doc).toEqual(rejectedDoc)
    expect(create).not.toHaveBeenCalled()
  })
})
