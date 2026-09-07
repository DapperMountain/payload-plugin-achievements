/** Normalize a Payload relationship value to a string id. */
export function relationId(value: unknown): string | null {
  if (typeof value === 'string' && value) return value
  if (typeof value === 'number' && Number.isFinite(value)) return String(value)
  if (value && typeof value === 'object' && 'id' in value) {
    const id = (value as { id?: unknown }).id
    if (typeof id === 'string' && id) return id
    if (typeof id === 'number' && Number.isFinite(id)) return String(id)
  }
  return null
}
