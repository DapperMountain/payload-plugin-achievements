import type { CollectionConfig } from 'payload'

import { requireOne } from '../../../access/index.js'
import { isReviewer, isSelfUser } from '../../../access/roles/index.js'

export const access: NonNullable<CollectionConfig['access']> = {
  read: requireOne(isReviewer('grants'), isSelfUser('user')),
  create: requireOne(isReviewer('grants')),
  update: requireOne(isReviewer('grants')),
  delete: requireOne(isReviewer('grants')),
}
