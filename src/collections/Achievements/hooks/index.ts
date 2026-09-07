import type { CollectionConfig } from 'payload'

import { validateAchievementRules } from './validateEligibilityRules'

export const hooks: CollectionConfig['hooks'] = {
  beforeValidate: [validateAchievementRules],
}
