import type { CollectionConfig } from 'payload'

import { grantOnApprovedRequest, prepareAchievementRequest } from './prepareAchievementRequest'

export const hooks: CollectionConfig['hooks'] = {
  beforeValidate: [prepareAchievementRequest],
  afterChange: [grantOnApprovedRequest],
}
