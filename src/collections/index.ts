import type { CollectionConfig } from 'payload'

import { getAchievementOptions } from '../options-store'
import type { AchievementCollectionKey } from '../types'
import { applyCollectionOverrides } from './applyOverrides'
import { buildAchievementRequestsCollection } from './AchievementRequests/index'
import { buildAchievementsCollection } from './Achievements/index'
import { buildEventTypesCollection } from './EventTypes/index'
import { buildGrantsCollection } from './Grants/index'
import { buildLogsCollection } from './Logs/index'
import { buildMetricsCollection } from './Metrics/index'
import { buildTiersCollection } from './Tiers/index'

const builders: Record<AchievementCollectionKey, () => CollectionConfig> = {
  metrics: buildMetricsCollection,
  eventTypes: buildEventTypesCollection,
  tiers: buildTiersCollection,
  achievements: buildAchievementsCollection,
  grants: buildGrantsCollection,
  achievementRequests: buildAchievementRequestsCollection,
  logs: buildLogsCollection,
}

/** Build achievement collections after plugin options are stored. */
export function buildAchievementCollections(): CollectionConfig[] {
  const overrides = getAchievementOptions().collections?.overrides

  return (Object.keys(builders) as AchievementCollectionKey[]).map((key) =>
    applyCollectionOverrides(builders[key](), overrides?.[key]),
  )
}
