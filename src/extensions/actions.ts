import type { Option } from 'payload'

import type { AchievementAction } from '../types.js'
import { getAchievementOptions } from '../options-store.js'

export const BUILTIN_GRANT_ACTION = 'achievement.grant'

/** Host actions whose `type` is not the built-in grant command. */
export function getHostActions(): AchievementAction[] {
  const out: AchievementAction[] = []
  const seen = new Set<string>([BUILTIN_GRANT_ACTION])
  for (const action of getAchievementOptions().extensions?.actions ?? []) {
    if (!action.type || seen.has(action.type)) continue
    seen.add(action.type)
    out.push(action)
  }
  return out
}

export function getHostAction(type: string): AchievementAction | null {
  return getHostActions().find((action) => action.type === type) ?? null
}

export function actionSelectOptions(): Option[] {
  return [
    { label: 'Grant achievement', value: BUILTIN_GRANT_ACTION },
    ...getHostActions().map((action) => ({
      label: action.label ?? action.type,
      value: action.type,
    })),
  ]
}
