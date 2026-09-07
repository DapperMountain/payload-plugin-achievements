import type { AchievementRuleType } from '../types'
import { getAchievementOptions } from '../options-store'
import { builtInRuleTypes } from '../services/achievement/builtInRules'

export function getRuleTypeMap(): Map<string, AchievementRuleType> {
  const map = new Map<string, AchievementRuleType>()
  for (const rule of builtInRuleTypes) {
    map.set(rule.type, rule)
  }
  for (const rule of getAchievementOptions().extensions?.ruleTypes ?? []) {
    map.set(rule.type, rule)
  }
  return map
}
