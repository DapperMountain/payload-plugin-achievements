import type { CollectionConfig } from 'payload'

import { requireOne } from '../../../access/index'
import { isReviewer, isSelfUser } from '../../../access/roles/index'

export const access: NonNullable<CollectionConfig['access']> = {
  read: requireOne(isReviewer('logs'), isSelfUser('user')),
  create: requireOne(isReviewer('logs')),
  update: requireOne(isReviewer('logs')),
  delete: requireOne(isReviewer('logs')),
}
