import { getAchievementOptions } from '../options-store.js'

const BUILTIN_ELAPSED_SINCE_OPTIONS = [
  { label: 'User created at', value: 'user-created-at' },
  { label: 'First matching event log', value: 'first-event' },
] as const

/** Admin select options for elapsed `since` (built-ins + host `metricAnchors` keys). */
export function elapsedSinceSelectOptions(): Array<{ label: string; value: string }> {
  const custom = Object.keys(getAchievementOptions().extensions?.metricAnchors ?? {})
  return [
    ...BUILTIN_ELAPSED_SINCE_OPTIONS.map((option) => ({ ...option })),
    ...custom.map((key) => ({ label: key, value: key })),
  ]
}

export function isBuiltinElapsedSince(since: string): boolean {
  return since === 'user-created-at' || since === 'first-event'
}
