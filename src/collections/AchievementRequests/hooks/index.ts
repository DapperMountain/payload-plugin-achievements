import type { CollectionConfig } from 'payload'

import { grantOnApprovedRequest, prepareAchievementRequest } from './prepareAchievementRequest.js'

export const hooks: CollectionConfig['hooks'] = {
  beforeValidate: [prepareAchievementRequest],
  afterChange: [grantOnApprovedRequest],
}
