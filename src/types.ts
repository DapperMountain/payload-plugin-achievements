import type { CollectionConfig, Field, OptionLabel, Payload, PayloadRequest, TypedUser } from 'payload'

/** Host-registered date anchors for computed elapsed metrics. */
export type AchievementMetricAnchor = (args: {
  payload: Payload
  req?: PayloadRequest
  userId: string
  scopeId: string | null
}) => Date | null | Promise<Date | null>

/**
 * Anchor with an Admin label.
 * `label` is a Payload Admin UI string ({@link OptionLabel}): plain string, `{ en, es, … }`,
 * or `({ t }) => t('custom:…')` (Admin UI / OptionLabel).
 */
export type AchievementMetricAnchorConfig = {
  label: OptionLabel
  resolve: AchievementMetricAnchor
}

export type AchievementMetricAnchorEntry = AchievementMetricAnchor | AchievementMetricAnchorConfig

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
   * Used for next-tier ladder fill and host UIs (progress display).
   */
  progress?: (args: AchievementRuleEvalArgs) => Promise<number> | number
  /**
   * `gate` rules (e.g. `tier-at-least`) are prerequisites that must already hold.
   * They are omitted from AND averages. Default: `requirement`.
   */
  progressRole?: 'requirement' | 'gate'
  /**
   * Admin select label. Payload {@link OptionLabel}: string, `{ en, es }`, or `({ t }) => t(…)`.
   * Defaults to `type` when omitted.
   */
  label?: OptionLabel
  /**
   * Admin fields shown when this leaf `type` is selected.
   * Merged into the rule row; plugin ANDs visibility with `type === this.type`.
   */
  fields?: Field[]
}

export type AchievementReactionTrigger = 'event' | 'achievement.granted' | 'achievement.revoked'

export type AchievementActionRunArgs = {
  payload: PayloadRequest['payload']
  req: PayloadRequest
  userId: string
  scopeId: string | null
  trigger: AchievementReactionTrigger
  /** Reaction catalog row (flat plugin fields plus host param fields). */
  reaction: Record<string, unknown>
  /** Present when `trigger` is `event`. */
  log?: Record<string, unknown> | null
  /** Present when `trigger` is grant/revoke. */
  achievementId?: string | null
}

/**
 * Host (or built-in) side effect when a reaction matches.
 * `run` must be **set-based / idempotent** — the plugin does not store reaction run history.
 */
export type AchievementAction = {
  type: string
  label?: OptionLabel
  fields?: Field[]
  run: (args: AchievementActionRunArgs) => Promise<void> | void
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
  | 'metricBalances'
  | 'reactions'

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
   * Root REST path for a stored-metric leaderboard (`GET`).
   * Default: `'/achievements/leaderboard'`. Requires an authenticated user.
   * Pass `false` to skip.
   */
  leaderboard?: string | false
  /**
   * Root REST path to repair progression from existing grants (`POST`).
   * Default: `'/achievements/reconcile'`. Requires host `canReview`.
   * Pass `false` to skip.
   */
  reconcile?: string | false
}

/**
 * Host documents that achievement logs may point at (polymorphic `subject`).
 * Empty / omitted → subject field is not registered (engine stays host-agnostic).
 */
export type AchievementSubjectsOptions = {
  /**
   * Collection slugs allowed on log `subject.relationTo` (e.g. `posts`, `comments`).
   * `'all'` = every collection on the host Config except plugin collections and `payload-*`.
   * Event types pick a subset via `subjectRelationTo`; validation rejects anything outside this list.
   */
  collections?: 'all' | string[]
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
  /**
   * Polymorphic log subjects — host allowlist of collections.
   * When set, event types gain `requiresSubject` / `subjectRelationTo` and logs gain `subject`.
   */
  subjects?: AchievementSubjectsOptions
  extensions?: {
    /** Custom rule evaluators merged with built-ins. `label` / `fields` surface in Admin. */
    ruleTypes?: AchievementRuleType[]
    /**
     * Named date anchors for computed `elapsed` metrics.
     * Keys appear in Admin `since` selects; missing keys resolve to null at eval time.
     */
    metricAnchors?: Record<string, AchievementMetricAnchorEntry>
    /**
     * Side-effect commands for the reactions catalog (e.g. `accessGroup.addMember`).
     * Built-in `achievement.grant` is always available. `run` must be idempotent.
     */
    actions?: AchievementAction[]
  }
  /**
   * When true (default), ensure system metrics + event types exist on Payload `onInit`
   * (`seedAchievementCatalog`). Host product catalogs still seed via `seedAchievements`.
   */
  seedSystemCatalog?: boolean
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

