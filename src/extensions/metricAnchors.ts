import type { OptionLabel } from 'payload'

import type {
  AchievementMetricAnchor,
  AchievementMetricAnchorConfig,
  AchievementMetricAnchorEntry,
} from '../types.js'
import { getAchievementOptions } from '../options-store.js'

function isAnchorConfig(entry: AchievementMetricAnchorEntry): entry is AchievementMetricAnchorConfig {
  return typeof entry === 'object' && entry != null && 'resolve' in entry
}

export function resolveMetricAnchorEntry(
  entry: AchievementMetricAnchorEntry,
  key: string,
): { label: OptionLabel; resolve: AchievementMetricAnchor } {
  if (isAnchorConfig(entry)) {
    return { label: entry.label, resolve: entry.resolve }
  }
  // Bare resolver: Admin shows the key until the host supplies a Payload label.
  return { label: key, resolve: entry }
}

export function getMetricAnchorEntries(): Array<{
  key: string
  label: OptionLabel
  resolve: AchievementMetricAnchor
}> {
  const anchors = getAchievementOptions().extensions?.metricAnchors ?? {}
  return Object.entries(anchors).map(([key, entry]) => {
    const resolved = resolveMetricAnchorEntry(entry, key)
    return { key, ...resolved }
  })
}

export function getMetricAnchorResolver(key: string): AchievementMetricAnchor | null {
  const entry = getAchievementOptions().extensions?.metricAnchors?.[key]
  if (!entry) return null
  return resolveMetricAnchorEntry(entry, key).resolve
}
