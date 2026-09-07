import { assertRuleGroupValid } from '../../../services/achievement/validateRules';
export const validateUnlockRules = ({ data }) => {
    if (!data)
        return data;
    assertRuleGroupValid(data.unlockRules, 'Unlock rules');
    return data;
};
