import { afterRequiresReviewDisabled } from './afterRequiresReviewDisabled.js';
import { validateUnlockRules } from './validateUnlockRules.js';
export const hooks = {
    beforeValidate: [validateUnlockRules],
    afterChange: [afterRequiresReviewDisabled],
};
