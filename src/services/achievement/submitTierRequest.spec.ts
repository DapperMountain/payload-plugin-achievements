import { describe, expect, test } from 'bun:test'
import { APIError } from 'payload'

import { submitTierRequest } from './submitTierRequest.js'

function mockReq(args: {
  userId?: string
  findDocs?: Record<string, unknown>[]
  create?: (data: Record<string, unknown>) => Promise<Record<string, unknown>>
  update?: (id: string, data: Record<string, unknown>) => Promise<Record<string, unknown>>
}) {
  const findCalls: unknown[] = []
  return {
    findCalls,
    req: {
      user: args.userId ? { id: args.userId } : null,
      payload: {
        find: async (opts: { where?: unknown }) => {
          findCalls.push(opts.where)
          return { docs: args.findDocs ?? [] }
        },
        create: async ({ data }: { data: Record<string, unknown> }) => {
          if (!args.create) throw new Error('unexpected create')
          return args.create(data)
        },
        update: async ({ id, data }: { id: string; data: Record<string, unknown> }) => {
          if (!args.update) throw new Error('unexpected update')
          return args.update(id, data)
        },
      },
    } as never,
  }
}

describe('submitTierRequest', () => {
  test('requires an authenticated user', async () => {
    const { req } = mockReq({})
    await expect(
      submitTierRequest({ req, userId: 'u1', tierId: 't1' }),
    ).rejects.toBeInstanceOf(APIError)
  })

  test('refuses submitting for a different user', async () => {
    const { req } = mockReq({ userId: 'u1' })
    await expect(
      submitTierRequest({ req, userId: 'u2', tierId: 't1' }),
    ).rejects.toMatchObject({ status: 403 })
  })

  test('returns an existing pending request', async () => {
    const pending = { id: 'tr1', status: 'pending' }
    const { req } = mockReq({ userId: 'u1', findDocs: [pending] })
    const doc = await submitTierRequest({ req, userId: 'u1', tierId: 't1' })
    expect(doc).toEqual(pending)
  })

  test('rejects when an approved request already exists', async () => {
    const { req } = mockReq({
      userId: 'u1',
      findDocs: [{ id: 'tr1', status: 'approved' }],
    })
    await expect(
      submitTierRequest({ req, userId: 'u1', tierId: 't1' }),
    ).rejects.toMatchObject({ status: 400 })
  })

  test('reopens the latest rejected request as pending', async () => {
    let findPass = 0
    const created: Record<string, unknown>[] = []
    const { req } = mockReq({
      userId: 'u1',
      findDocs: [],
      update: async (id, data) => ({ id, ...data }),
    })
    // Override find to return empty open, then rejected.
    ;(req as { payload: { find: (opts: unknown) => Promise<{ docs: unknown[] }> } }).payload.find =
      async () => {
        findPass += 1
        if (findPass === 1) return { docs: [] }
        return { docs: [{ id: 'tr-rej' }] }
      }

    const doc = await submitTierRequest({
      req,
      userId: 'u1',
      tierId: 't1',
      note: 'try again',
    })
    expect(doc).toEqual({ id: 'tr-rej', status: 'pending', note: 'try again' })
    expect(created).toEqual([])
  })

  test('creates a pending request when none exist', async () => {
    const { req } = mockReq({
      userId: 'u1',
      findDocs: [],
      create: async (data) => ({ id: 'tr-new', ...data }),
    })
    // Both finds empty
    ;(req as { payload: { find: () => Promise<{ docs: unknown[] }> } }).payload.find = async () => ({
      docs: [],
    })

    const doc = await submitTierRequest({
      req,
      userId: 'u1',
      tierId: 't1',
      scopeId: 's1',
      note: 'ready',
    })
    expect(doc).toMatchObject({
      id: 'tr-new',
      user: 'u1',
      tier: 't1',
      scope: 's1',
      note: 'ready',
      status: 'pending',
    })
  })
})
