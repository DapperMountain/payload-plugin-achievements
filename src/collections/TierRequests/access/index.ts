import type { CollectionConfig } from 'payload'

import { isAuthenticated, requireOne } from '../../../access/index.js'
import { isReviewer, isSelfUser } from '../../../access/roles/index.js'

export const access: NonNullable<CollectionConfig['access']> = {
  read: requireOne(isReviewer('tierRequests'), isSelfUser('user')),
  create: isAuthenticated,
  update: requireOne(isReviewer('tierRequests')),
  delete: requireOne(isReviewer('tierRequests')),
}
