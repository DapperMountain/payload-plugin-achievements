import type { CollectionAfterChangeHook, CollectionAfterDeleteHook } from 'payload'

import { CTX_SKIP_GRANT_SIDE_EFFECTS } from '../../../services/achievement/contextFlags.js'
import { getEventTypeFlags } from '../../../services/achievement/eventTypeRequiresActor.js'
import { syncProgressionFromLog } from '../../../services/achievement/grantSideEffects.js'
import { relationId } from '../../../services/achievement/relationId.js'
import { runReactions } from '../../../services/achievement/runReactions.js'

async function syncFromLogDoc(
  req: Parameters<CollectionAfterChangeHook>[0]['req'],
  doc: Record<string, unknown>,
  operation: 'create' | 'delete',
): Promise<void> {
  if (req.context?.[CTX_SKIP_GRANT_SIDE_EFFECTS]) return

  const userId = relationId(doc.user)
  if (!userId) return

  const flags = await getEventTypeFlags({
    payload: req.payload,
    req,
    typeIdOrDoc: doc.type,
  })
  const scopeId = relationId(doc.scope)
  const eventTypeId = relationId(doc.type)

  await syncProgressionFromLog({
    req,
    userId,
    scopeId,
    eventTypeSlug: flags.slug,
    operation,
  })

  if (operation === 'create') {
    await runReactions({
      req,
      trigger: 'event',
      userId,
      scopeId,
      eventTypeId,
      eventTypeSlug: flags.slug,
      log: doc,
    })
  }
}

export const afterLogChange: CollectionAfterChangeHook = async ({ doc, operation, req }) => {
  if (operation !== 'create') return doc
  await syncFromLogDoc(req, doc as Record<string, unknown>, 'create')
  return doc
}

export const afterLogDelete: CollectionAfterDeleteHook = async ({ doc, req }) => {
  await syncFromLogDoc(req, doc as Record<string, unknown>, 'delete')
  return doc
}
