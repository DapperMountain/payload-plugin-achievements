import type { CollectionConfig } from 'payload'

import { getAchievementOptions } from '../options-store.js'
import type { AchievementCollectionKey } from '../types.js'
import { applyCollectionOverrides } from './applyOverrides.js'
import { buildAchievementRequestsCollection } from './AchievementRequests/index.js'
import { buildAchievementsCollection } from './Achievements/index.js'
import { buildEventTypesCollection } from './EventTypes/index.js'
import { buildGrantsCollection } from './Grants/index.js'
import { buildLogsCollection } from './Logs/index.js'
import { buildMetricBalancesCollection } from './MetricBalances/index.js'
import { buildMetricsCollection } from './Metrics/index.js'
import { buildTierRequestsCollection } from './TierRequests/index.js'
import { buildTiersCollection } from './Tiers/index.js'

const builders: Record<AchievementCollectionKey, () => CollectionConfig> = {
  metrics: buildMetricsCollection,
  metricBalances: buildMetricBalancesCollection,
  eventTypes: buildEventTypesCollection,
  tiers: buildTiersCollection,
  achievements: buildAchievementsCollection,
  grants: buildGrantsCollection,
  achievementRequests: buildAchievementRequestsCollection,
  tierRequests: buildTierRequestsCollection,
  logs: buildLogsCollection,
}

/** Build achievement collections after plugin options are stored. */
export function buildAchievementCollections(): CollectionConfig[] {
  const overrides = getAchievementOptions().collections?.overrides

  return (Object.keys(builders) as AchievementCollectionKey[]).map((key) =>
    applyCollectionOverrides(builders[key](), overrides?.[key]),
  )
}
