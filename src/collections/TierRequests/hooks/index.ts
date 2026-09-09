import type { CollectionConfig } from 'payload'

import { afterTierRequestChange, prepareTierRequest } from './prepareTierRequest.js'

export const hooks: CollectionConfig['hooks'] = {
  beforeValidate: [prepareTierRequest],
  afterChange: [afterTierRequestChange],
}
