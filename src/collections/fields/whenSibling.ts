import type { Field } from 'payload'

/**
 * AND an existing Admin `condition` with “sibling[key] === value”.
 * Used so host rule/action fields only show for their `type` / `action`.
 */
export function whenSiblingEquals(field: Field, key: string, value: string): Field {
  const admin =
    'admin' in field && field.admin && typeof field.admin === 'object' ? field.admin : {}
  const existing =
    'condition' in admin && typeof admin.condition === 'function' ? admin.condition : undefined

  return {
    ...field,
    admin: {
      ...admin,
      condition: (data: unknown, siblingData: Record<string, unknown>, ctx: unknown) => {
        if (siblingData?.[key] !== value) return false
        if (!existing) return true
        return Boolean(existing(data as never, siblingData as never, ctx as never))
      },
    },
  } as Field
}
