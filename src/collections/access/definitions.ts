import type { CollectionConfig } from 'payload'

import type { AchievementCollectionKey } from '../../types'
import { isAuthenticated, requireOne } from '../../access/index'
import { isReviewer } from '../../access/roles/index'

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
