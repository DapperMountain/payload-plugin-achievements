import type { CollectionConfig } from 'payload'

import { requireOne } from '../../../access/index.js'
import { isReviewer, isSelfUser } from '../../../access/roles/index.js'

export const access: NonNullable<CollectionConfig['access']> = {
  read: requireOne(isReviewer('logs'), isSelfUser('user')),
  create: requireOne(isReviewer('logs')),
  update: requireOne(isReviewer('logs')),
  delete: requireOne(isReviewer('logs')),
}
