import type { Field } from 'payload'

import { getAchievementOptions } from '../../options-store'

/**
 * Optional relationship to the host scope collection.
 * Returns `null` when `options.scope.collection` is unset — callers should omit it.
 */
export function scopeField(): Field | null {
  const options = getAchievementOptions()
  const relationTo = options.scope?.collection
  if (!relationTo) return null

  const name = options.scope?.relationField ?? 'scope'

  return {
    name,
    type: 'relationship',
    relationTo: relationTo,
    required: false,
    index: true,
    admin: {
      description: 'Optional tenant or workspace this belongs to.',
    },
  }
}
