import type { CollectionBeforeValidateHook } from 'payload'

import { assertRuleGroupValid } from '../../../services/achievement/validateRules'

export const validateAchievementRules: CollectionBeforeValidateHook = ({ data }) => {
  if (!data) return data
  assertRuleGroupValid(
    (data as { eligibilityRules?: unknown }).eligibilityRules as never,
    'Eligibility rules',
  )
  assertRuleGroupValid(
    (data as { completionRules?: unknown }).completionRules as never,
    'Completion rules',
  )
  return data
}
