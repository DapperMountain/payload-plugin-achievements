import type { CollectionConfig } from 'payload'

import { afterRequiresReviewDisabled } from './afterRequiresReviewDisabled'
import { validateUnlockRules } from './validateUnlockRules'

export const hooks: CollectionConfig['hooks'] = {
  beforeValidate: [validateUnlockRules],
  afterChange: [afterRequiresReviewDisabled],
}
