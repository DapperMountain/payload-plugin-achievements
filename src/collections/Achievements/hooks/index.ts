import type { CollectionConfig } from 'payload'

import { afterRequiresReviewDisabled } from './afterRequiresReviewDisabled'
import { validateAchievementRules } from './validateEligibilityRules'

export const hooks: CollectionConfig['hooks'] = {
  beforeValidate: [validateAchievementRules],
  afterChange: [afterRequiresReviewDisabled],
}
