import type { CollectionConfig } from 'payload'

import { ensureTypeRequirements } from './ensureTypeRequirements.js'

export const hooks: CollectionConfig['hooks'] = {
  beforeValidate: [ensureTypeRequirements],
}
