import type { CollectionConfig } from 'payload'

import { afterRequiresReviewDisabled } from './afterRequiresReviewDisabled.js'
import { validateUnlockRules } from './validateUnlockRules.js'

export const hooks: CollectionConfig['hooks'] = {
  beforeValidate: [validateUnlockRules],
  afterChange: [afterRequiresReviewDisabled],
}
