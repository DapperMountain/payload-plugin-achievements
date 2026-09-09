import { grantOnApprovedRequest, prepareAchievementRequest } from './prepareAchievementRequest.js';
export const hooks = {
    beforeValidate: [prepareAchievementRequest],
    afterChange: [grantOnApprovedRequest],
};
