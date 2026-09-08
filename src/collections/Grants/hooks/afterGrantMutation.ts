import type { CollectionAfterChangeHook, CollectionAfterDeleteHook } from 'payload'

import { CTX_CASCADING_REVOKE, CTX_SKIP_GRANT_SIDE_EFFECTS, runAfterGrantCreated, runAfterGrantDeleted } from '../../../services/achievement/grantSideEffects'
import { relationId } from '../../../services/achievement/relationId'
import { collectionOf } from '../../../collections/helpers'

async function achievementSlug(
  req: Parameters<CollectionAfterChangeHook>[0]['req'],
  achievementId: string,
): Promise<string | undefined> {
  try {
    const def = (await req.payload.findByID({
      collection: collectionOf('achievements'),
      id: achievementId,
      depth: 0,
      overrideAccess: true,
      req,
      select: { slug: true },
    })) as { slug?: string } | null
    return def?.slug
  } catch {
    return undefined
  }
}

export const afterGrantChange: CollectionAfterChangeHook = async ({ doc, operation, req }) => {
  if (operation !== 'create') return doc
  if (req.context?.[CTX_SKIP_GRANT_SIDE_EFFECTS]) return doc

  const userId = relationId((doc as { user?: unknown }).user)
  const achievementId = relationId((doc as { achievement?: unknown }).achievement)
  if (!userId || !achievementId) return doc

  const scopeId = relationId((doc as { scope?: unknown }).scope)

  await runAfterGrantCreated({
    req,
    userId,
    achievementId,
    scopeId,
    achievementSlug: await achievementSlug(req, achievementId),
  })

  return doc
}

export const afterGrantDelete: CollectionAfterDeleteHook = async ({ doc, req }) => {
  if (req.context?.[CTX_SKIP_GRANT_SIDE_EFFECTS]) return doc

  const userId = relationId((doc as { user?: unknown }).user)
  const achievementId = relationId((doc as { achievement?: unknown }).achievement)
  if (!userId || !achievementId) return doc

  const scopeId = relationId((doc as { scope?: unknown }).scope)

  await runAfterGrantDeleted({
    req,
    userId,
    achievementId,
    scopeId,
    achievementSlug: await achievementSlug(req, achievementId),
    cascading: Boolean(req.context?.[CTX_CASCADING_REVOKE]),
  })

  return doc
}
