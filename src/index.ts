export {
  DEFAULT_ACHIEVEMENT_METRIC,
  DEFAULT_ACHIEVEMENT_METRIC_SLUG,
  ENGINE_EVENT_TYPES,
  ENGINE_METRICS,
} from './catalog.js'
export type { EngineEventTypeSlug, EngineMetricSlug } from './catalog.js'
export { achievementPlugin } from './plugin.js'
export { seedAchievementCatalog, seedAchievements } from './seed/index.js'
export type {
  AchievementSeedAchievement,
  AchievementSeedCatalogRow,
  AchievementSeedInput,
  AchievementSeedLocalizedText,
  AchievementSeedTier,
} from './seed/index.js'
export {
  evaluateRules,
  evaluateRuleProgress,
  collectAchievementCompleteRefs,
  buildCatalogProgressGroups,
  getUserProgress,
  grantAchievement,
  recordEvent,
  recordLog,
  recordMetricChange,
  reconcileProgression,
  reconcileUserProgression,
  releasePendingAchievementReviews,
  releasePendingTierReviews,
  resolveCurrentTier,
  resolveTierProgress,
  reviewAchievementRequest,
  submitAchievementRequest,
  syncTierChangedLog,
  syncTierProgression,
  syncCompositeProgression,
  catalogRef,
  transitionLogData,
  transitionToId,
  validateRuleGroup,
  validateRuleNode,
} from './services/achievement/index.js'
export type {
  ResolvedTier,
  RuleGroup,
  TierLadderProgress,
  CatalogProgressGroup,
  CatalogProgressItem,
  CatalogRef,
  TransitionLogData,
  ReconcileProgressionArgs,
  ReconcileProgressionResult,
  ReleaseReviewGateResult,
} from './services/achievement/index.js'
export type {
  BuiltInEventType,
  BuiltInRuleType,
  AchievementCollectionKey,
  AchievementCollectionOverride,
  AchievementCollectionsOptions,
  AchievementEndpointsOptions,
  AchievementPluginOptions,
  AchievementRuleType,
  AchievementScopeConfig,
  AchievementUsersOptions,
} from './types.js'
export { DEFAULT_COLLECTION_BASE_SLUGS, DEFAULT_COLLECTION_PREFIX, DEFAULT_ADMIN_GROUP } from './collections/slugs.js'
export { DEFAULT_ME_ENDPOINT_PATH, DEFAULT_RECONCILE_ENDPOINT_PATH } from './defaults.js'
export { collectionOf, slugOf } from './collections/helpers.js'
export { isAchievementPluginEnabled } from './enabled.js'
