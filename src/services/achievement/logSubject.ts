import { relationId } from './relationId.js'

/** Polymorphic relationship value (Payload `relationTo` + `value`). */
export type LogSubjectRef = {
  relationTo: string
  value: string
}

/** Build a log subject ref for `recordLog({ subject })`. */
export function logSubject(relationTo: string, value: string): LogSubjectRef {
  return { relationTo, value }
}

/**
 * Normalize a polymorphic relationship (Admin / Local API shape) to `{ relationTo, value }`.
 * Accepts nested docs (`value: { id }`) and plain ids under `value`.
 */
export function readLogSubject(value: unknown): LogSubjectRef | null {
  if (!value || typeof value !== 'object') return null
  const row = value as { relationTo?: unknown; value?: unknown }
  if (typeof row.relationTo !== 'string' || !row.relationTo.trim()) return null
  const id = relationId(row.value)
  if (!id) return null
  return { relationTo: row.relationTo.trim(), value: id }
}
