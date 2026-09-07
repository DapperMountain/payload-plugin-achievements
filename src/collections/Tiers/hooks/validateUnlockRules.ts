import type { CollectionBeforeValidateHook } from 'payload'

import { assertRuleGroupValid } from '../../../services/achievement/validateRules'

export const validateUnlockRules: CollectionBeforeValidateHook = ({ data }) => {
  if (!data) return data
  assertRuleGroupValid(
    (data as { unlockRules?: unknown }).unlockRules as never,
    'Unlock rules',
  )
  return data
}
