import type { CollectionConfig, PayloadRequest, TypedUser } from 'payload'

export type AchievementScopeConfig = {
  collection: string
  relationField?: string
}

export type AchievementRuleEvalArgs = {
  payload: PayloadRequest['payload']
  req: PayloadRequest
  rule: Record<string, unknown>
  userId: string
  scopeId: string | null
  /**
   * Rank already unlocked while walking the tier ladder.
   * `null` = none yet; omit when evaluating outside a ladder walk.
   */
  ladderRank?: number | null
  /** Achievement ids already visited while rolling up nested `achievement-complete` progress. */
  progressVisited?: Set<string>
}

export type AchievementRuleType = {
  type: string
  evaluate: (args: AchievementRuleEvalArgs) => Promise<boolean> | boolean
  /**
   * Optional fractional progress toward this leaf (0..1).
   * When omitted, progress falls back to `evaluate` → 0 or 1.
   * Used for next-tier ladder fill and host UIs — not for unlock boolean.
   */
  progress?: (args: AchievementRuleEvalArgs) => Promise<number> | number
  /**
   * `gate` rules (e.g. `tier-at-least`) are prerequisites, not progress.
   * They are omitted from AND averages. Default: `requirement`.
   */
  progressRole?: 'requirement' | 'gate'
}

/** Logical collection ids — map to configurable slugs via `collections`. */
export type AchievementCollectionKey =
  | 'tiers'
  | 'achievements'
  | 'grants'
  | 'achievementRequests'
  | 'tierRequests'
  | 'logs'
  | 'eventTypes'
  | 'metrics'

/**
 * Host overrides layered onto a plugin collection (Form Builder–style).
 * Access/admin merge shallowly; hook arrays are appended after plugin hooks.
 */
export type AchievementCollectionOverride = {
  access?: CollectionConfig['access']
  admin?: CollectionConfig['admin']
  hooks?: CollectionConfig['hooks']
  labels?: CollectionConfig['labels']
}

export type AchievementCollectionsOptions = {
  /**
   * Prefix applied to default slugs when no per-collection override is set.
   * Drives collection slug, REST `/api/{slug}`, and DB table names.
   * Default: `'achievement'` (e.g. `achievement-tiers`, `achievement-logs`).
   * Always set so host collections are not clobbered. Admin nav grouping is separate (`adminGroup`).
   */
  prefix?: string
  /**
   * Admin sidebar group for all plugin collections.
   * Default: `'Achievements'`. Pass `false` to leave ungrouped.
   */
  adminGroup?: string | false
  /** Absolute slug overrides (ignore `prefix` for that key). */
  slugs?: Partial<Record<AchievementCollectionKey, string>>
  /**
   * Per-collection overrides merged on top of plugin defaults.
   * Hook arrays append after the plugin’s; access keys replace the matching operation.
   */
  overrides?: Partial<Record<AchievementCollectionKey, AchievementCollectionOverride>>
}

export type AchievementUsersOptions = {
  /**
   * Inject an `achievements` group on the users collection with joins to
   * grants + requests (`user.achievements.grants` / `.requests`).
   * Default: `true`. Pass `false` when the host owns that surface.
   */
  includeJoins?: boolean
}

export type AchievementEndpointsOptions = {
  /**
   * Root REST path for the current-user grants snapshot (`GET`).
   * Default: `'/achievements/me'` → `/api/achievements/me`.
   * Pass `false` to skip registering the endpoint.
   */
  me?: string | false
  /**
   * Root REST path to repair progression from existing grants (`POST`).
   * Default: `'/achievements/reconcile'`. Requires host `canReview`.
   * Pass `false` to skip.
   */
  reconcile?: string | false
}

export type AchievementPluginOptions = {
  /**
   * Whether the user may review requests and manage achievement catalogs for a scope.
   * Required for catalog edits and request approval. When omitted, those writes are denied.
   */
  canReview?: (user: TypedUser, scopeId: string | null) => boolean | Promise<boolean>
  /** Collection slug / admin grouping config. */
  collections?: AchievementCollectionsOptions
  enabled?: boolean
  /** Custom root API routes registered by the plugin. */
  endpoints?: AchievementEndpointsOptions
  extensions?: {
    /** Custom rule evaluators merged with built-ins. */
    ruleTypes?: AchievementRuleType[]
  }
  /**
   * Host upload collection slug (e.g. `'media'`). When set, tiers gain an optional
   * `image` upload field for ladder badges. Icon keys still work without this.
   */
  mediaCollection?: string
  scope?: AchievementScopeConfig
  /**
   * @deprecated Prefer `collections.prefix`.
   * Still honored when `collections.prefix` is unset.
   */
  slugPrefix?: string
  /** Users-collection joins / field injection. */
  users?: AchievementUsersOptions
  usersCollectionSlug?: string
}

export type BuiltInRuleType =
  | 'achievement-complete'
  | 'event-count'
  | 'metric-minimum'
  | 'tier-at-least'

/** Engine log-type catalog slugs (seeded as system catalog rows). */
export type BuiltInEventType =
  | 'achievement.granted'
  | 'achievement.revoked'
  | 'metric.delta'
  | 'tier.changed'

