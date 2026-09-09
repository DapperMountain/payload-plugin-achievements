import type { Payload } from 'payload'

import { slugOf } from './collections/helpers.js'
import { getAchievementOptions } from './options-store.js'

/** True when the plugin is opted in and its collections are on this Payload config. */
export function isAchievementPluginEnabled(payload: Payload): boolean {
  if (!getAchievementOptions().enabled) return false
  const slug = slugOf('logs')
  return Boolean(payload.config.collections?.some((collection) => collection.slug === slug))
}
