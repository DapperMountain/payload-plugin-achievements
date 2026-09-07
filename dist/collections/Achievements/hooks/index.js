import { validateAchievementRules } from './validateEligibilityRules';
export const hooks = {
    beforeValidate: [validateAchievementRules],
};
