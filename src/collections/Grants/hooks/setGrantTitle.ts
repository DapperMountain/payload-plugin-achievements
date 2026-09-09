import type {
  CollectionAfterReadHook,
  CollectionBeforeChangeHook,
  Payload,
  PayloadRequest,
} from 'payload'

import { relationId } from '../../../services/achievement/relationId.js'
import { collectionOf } from '../../helpers.js'

async function achievementName(args: {
  payload: Payload
  req?: PayloadRequest
  value: unknown
}): Promise<string> {
  const id = relationId(args.value)
  if (!id) return 'Grant'

  if (args.value && typeof args.value === 'object') {
    const row = args.value as { name?: unknown }
    if (typeof row.name === 'string' && row.name) return row.name
  }

  try {
    const doc = await args.payload.findByID({
      collection: collectionOf('achievements'),
      id,
      depth: 0,
      overrideAccess: true,
      req: args.req,
      ...(args.req?.locale ? { locale: args.req.locale } : {}),
    })
    const name = (doc as { name?: unknown } | null)?.name
    return typeof name === 'string' && name ? name : id
  } catch {
    return id
  }
}

export const setGrantTitle: CollectionBeforeChangeHook = async ({ data, originalDoc, req }) => {
  if (!req?.payload || !data) return data

  data.title = await achievementName({
    payload: req.payload,
    req,
    value: data.achievement ?? (originalDoc as { achievement?: unknown } | undefined)?.achievement,
  })

  return data
}

export const fillGrantTitle: CollectionAfterReadHook = async ({ doc, req }) => {
  if (!req?.payload || !doc) return doc

  doc.title = await achievementName({
    payload: req.payload,
    req,
    value: (doc as { achievement?: unknown }).achievement,
  })

  return doc
}
