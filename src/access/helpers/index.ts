import type { Access, AccessArgs, PayloadRequest, Where } from 'payload'

type AccessResult = boolean | Where

export type AccessFn = (args: AccessArgs) => AccessResult | Promise<AccessResult>

export const allowAll: Access = () => true

export const denyAll: Access = () => false

export function requireOne(...fns: AccessFn[]): Access {
  return async (args) => {
    for (const fn of fns) {
      const result = await fn(args)
      if (result === true) return true
      if (result && typeof result === 'object') return result
    }
    return false
  }
}

export function getUserId(req: PayloadRequest): string | null {
  const user = req.user
  if (!user || typeof user !== 'object') return null
  const id = (user as { id?: unknown }).id
  if (typeof id === 'string' && id) return id
  if (typeof id === 'number' && Number.isFinite(id)) return String(id)
  return null
}
