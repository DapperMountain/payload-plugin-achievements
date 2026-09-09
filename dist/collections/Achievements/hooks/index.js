import { afterRequiresReviewDisabled } from './afterRequiresReviewDisabled.js';
import { validateAchievementRules } from './validateEligibilityRules.js';
export const hooks = {
    beforeValidate: [validateAchievementRules],
    afterChange: [afterRequiresReviewDisabled],
};
