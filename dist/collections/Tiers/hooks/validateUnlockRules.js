import { assertRuleGroupValid } from '../../../services/achievement/validateRules.js';
export const validateUnlockRules = ({ data }) => {
    if (!data)
        return data;
    assertRuleGroupValid(data.unlockRules, 'Unlock rules');
    return data;
};
