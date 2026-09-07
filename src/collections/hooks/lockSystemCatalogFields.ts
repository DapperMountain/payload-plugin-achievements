import type { CollectionBeforeChangeHook } from 'payload'

/**
 * System catalog rows keep a fixed slug and stay marked system on update
 * so engine lookups by slug cannot be broken from Admin.
 */
export const lockSystemCatalogFields: CollectionBeforeChangeHook = ({ data, originalDoc, operation }) => {
  if (!data || operation !== 'update') return data
  if (!(originalDoc as { system?: boolean } | undefined)?.system) return data

  data.system = true
  if (typeof (originalDoc as { slug?: unknown }).slug === 'string') {
    data.slug = (originalDoc as { slug: string }).slug
  }
  return data
}
