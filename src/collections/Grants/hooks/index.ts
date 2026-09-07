import type { CollectionConfig } from 'payload'

import { ensureUniqueGrant } from './ensureUniqueGrant'
import { fillGrantTitle, setGrantTitle } from './setGrantTitle'

export const hooks: CollectionConfig['hooks'] = {
  beforeValidate: [ensureUniqueGrant],
  beforeChange: [setGrantTitle],
  afterRead: [fillGrantTitle],
}
