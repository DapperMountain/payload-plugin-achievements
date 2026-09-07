import type { CollectionBeforeValidateHook, Where } from 'payload'
import { APIError } from 'payload'

import { collectionOf } from '../../helpers'
import { relationId } from '../../../services/achievement/relationId'

/** Reject a second grant of the same achievement for the same user (+ scope). */
export const ensureUniqueGrant: CollectionBeforeValidateHook = async ({
  data,
  originalDoc,
  operation,
  req,
}) => {
  if (!req?.payload || !data) return data

  const userId = relationId(data.user ?? originalDoc?.user)
  const achievementId = relationId(data.achievement ?? originalDoc?.achievement)
  const scopeId = relationId(data.scope ?? originalDoc?.scope)

  if (!userId || !achievementId) return data

  const clauses: Where[] = [
    { user: { equals: userId } },
    { achievement: { equals: achievementId } },
  ]
  if (scopeId) clauses.push({ scope: { equals: scopeId } })
  else clauses.push({ scope: { exists: false } })

  const existing = await req.payload.find({
    collection: collectionOf('grants'),
    depth: 0,
    limit: 1,
    overrideAccess: true,
    req,
    where: { and: clauses },
  })

  const other = existing.docs[0]
  if (other && (operation === 'create' || relationId(other.id) !== relationId(originalDoc?.id))) {
    throw new APIError('This achievement is already granted to that user for this scope.', 400)
  }

  return data
}
