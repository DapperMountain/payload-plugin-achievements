import type { CollectionConfig } from 'payload'

import { ensureTypeRequirements } from './ensureTypeRequirements.js'
import { afterLogChange, afterLogDelete } from './afterLogMutation.js'

export const hooks: CollectionConfig['hooks'] = {
  beforeValidate: [ensureTypeRequirements],
  afterChange: [afterLogChange],
  afterDelete: [afterLogDelete],
}
