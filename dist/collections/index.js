import { getAchievementOptions } from '../options-store';
import { applyCollectionOverrides } from './applyOverrides';
import { buildAchievementRequestsCollection } from './AchievementRequests/index';
import { buildAchievementsCollection } from './Achievements/index';
import { buildEventTypesCollection } from './EventTypes/index';
import { buildGrantsCollection } from './Grants/index';
import { buildLogsCollection } from './Logs/index';
import { buildMetricsCollection } from './Metrics/index';
import { buildTierRequestsCollection } from './TierRequests/index';
import { buildTiersCollection } from './Tiers/index';
const builders = {
    metrics: buildMetricsCollection,
    eventTypes: buildEventTypesCollection,
    tiers: buildTiersCollection,
    achievements: buildAchievementsCollection,
    grants: buildGrantsCollection,
    achievementRequests: buildAchievementRequestsCollection,
    tierRequests: buildTierRequestsCollection,
    logs: buildLogsCollection,
};
/** Build achievement collections after plugin options are stored. */
export function buildAchievementCollections() {
    const overrides = getAchievementOptions().collections?.overrides;
    return Object.keys(builders).map((key) => applyCollectionOverrides(builders[key](), overrides?.[key]));
}
