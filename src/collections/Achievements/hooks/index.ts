import type { CollectionConfig } from 'payload'

import { afterRequiresReviewDisabled } from './afterRequiresReviewDisabled.js'
import { validateAchievementRules } from './validateEligibilityRules.js'

export const hooks: CollectionConfig['hooks'] = {
  beforeValidate: [validateAchievementRules],
  afterChange: [afterRequiresReviewDisabled],
}
