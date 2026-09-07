import { validateUnlockRules } from './validateUnlockRules';
export const hooks = {
    beforeValidate: [validateUnlockRules],
};
