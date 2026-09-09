import type { CollectionConfig } from 'payload'

import type { AchievementCollectionKey } from '../../types.js'
import { isAuthenticated, requireOne } from '../../access/index.js'
import { isReviewer } from '../../access/roles/index.js'

/** Catalog / definition collections (writes gated by `canReview`). */
export function definitionAccess(
  collectionKey: AchievementCollectionKey,
): NonNullable<CollectionConfig['access']> {
  return {
    read: isAuthenticated,
    create: requireOne(isReviewer(collectionKey)),
    update: requireOne(isReviewer(collectionKey)),
    delete: requireOne(isReviewer(collectionKey)),
  }
}
