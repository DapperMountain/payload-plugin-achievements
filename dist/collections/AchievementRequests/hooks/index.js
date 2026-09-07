import { grantOnApprovedRequest, prepareAchievementRequest } from './prepareAchievementRequest';
export const hooks = {
    beforeValidate: [prepareAchievementRequest],
    afterChange: [grantOnApprovedRequest],
};
