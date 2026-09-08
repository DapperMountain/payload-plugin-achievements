import { afterRequiresReviewDisabled } from './afterRequiresReviewDisabled';
import { validateUnlockRules } from './validateUnlockRules';
export const hooks = {
    beforeValidate: [validateUnlockRules],
    afterChange: [afterRequiresReviewDisabled],
};
