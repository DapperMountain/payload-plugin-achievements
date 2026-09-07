import type { CollectionConfig } from 'payload'

import { ensureTypeRequirements } from './ensureTypeRequirements'

export const hooks: CollectionConfig['hooks'] = {
  beforeValidate: [ensureTypeRequirements],
}
