import { assertRuleGroupValid } from '../../../services/achievement/validateRules.js';
export const validateAchievementRules = ({ data }) => {
    if (!data)
        return data;
    assertRuleGroupValid(data.eligibilityRules, 'Eligibility rules');
    assertRuleGroupValid(data.completionRules, 'Completion rules');
    return data;
};
