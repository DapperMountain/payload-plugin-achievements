import { afterRequiresReviewDisabled } from './afterRequiresReviewDisabled';
import { validateAchievementRules } from './validateEligibilityRules';
export const hooks = {
    beforeValidate: [validateAchievementRules],
    afterChange: [afterRequiresReviewDisabled],
};
