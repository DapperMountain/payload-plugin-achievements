import { assertRuleGroupValid } from '../../../services/achievement/validateRules';
export const validateAchievementRules = ({ data }) => {
    if (!data)
        return data;
    assertRuleGroupValid(data.eligibilityRules, 'Eligibility rules');
    assertRuleGroupValid(data.completionRules, 'Completion rules');
    return data;
};
