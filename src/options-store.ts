import type { AchievementPluginOptions } from './types'
import { resolveOptions, type ResolvedAchievementOptions } from './defaults'

let stored: ResolvedAchievementOptions | null = null

export function setAchievementOptions(options: AchievementPluginOptions): void {
  stored = resolveOptions(options)
}

/** Test helper — clears the process-wide options singleton. */
export function resetAchievementOptions(): void {
  stored = null
}

export function getAchievementOptions(): ResolvedAchievementOptions {
  if (!stored) {
    stored = resolveOptions({})
  }
  return stored
}
