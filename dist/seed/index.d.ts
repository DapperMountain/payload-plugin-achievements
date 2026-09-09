import type { Payload } from 'payload';
/** Default-locale string, or per-locale map for fields marked `localized: true` (host locales). */
export type AchievementSeedLocalizedText = string | {
    en: string;
    [locale: string]: string | undefined;
};
export type AchievementSeedTier = {
    name: AchievementSeedLocalizedText;
    slug: string;
    rank: number;
    description?: AchievementSeedLocalizedText;
    /** Optional Lucide-style icon key for the rank ladder (e.g. `sparkles`, `shield`). */
    icon?: string;
    /** Optional media upload id when the host configured `mediaCollection`. */
    image?: string;
    scope?: string;
    /** When true, unlock rules are not enough — an approved tier request is required. */
    requiresReview?: boolean;
    /** Bare rule array (AND) or `{ combinator, rules }`. Seed slugs resolved to relationships. */
    unlockRules?: Record<string, unknown>[] | {
        combinator?: string;
        rules?: Record<string, unknown>[];
    };
};
export type AchievementSeedAchievement = {
    name: AchievementSeedLocalizedText;
    slug: string;
    description?: AchievementSeedLocalizedText;
    scope?: string;
    requiresReview?: boolean;
    eligibilityRules?: Record<string, unknown>[] | {
        combinator?: string;
        rules?: Record<string, unknown>[];
    };
    /** What this achievement is composed of (auto-grant when these pass and requiresReview is false). */
    completionRules?: Record<string, unknown>[] | {
        combinator?: string;
        rules?: Record<string, unknown>[];
    };
};
export type AchievementSeedCatalogRow = {
    name: AchievementSeedLocalizedText;
    slug: string;
    scope?: string;
    system?: boolean;
    /** Metrics — `stored` (default) or `computed`. */
    kind?: 'stored' | 'computed';
    /** Computed metrics — v1 only `elapsed`. */
    compute?: 'elapsed';
    /** Computed elapsed — unit of the exposed number. */
    unit?: 'seconds' | 'minutes' | 'hours' | 'days' | 'years';
    /** Computed elapsed — built-in or host `metricAnchors` key. */
    since?: string;
    /** Computed elapsed with `since: first-event` — event type slug. */
    eventTypeSlug?: string;
    /** Event types only — when true, logging the event requires an actor. */
    requiresActor?: boolean;
    /** Event types only — when true, logging the event requires metric + change. */
    requiresMetric?: boolean;
};
export type AchievementSeedInput = {
    eventTypes?: AchievementSeedCatalogRow[];
    metrics?: AchievementSeedCatalogRow[];
    tiers?: AchievementSeedTier[];
    achievements?: AchievementSeedAchievement[];
    /** Slugs to delete after upsert (e.g. renamed catalog rows). */
    removeAchievementSlugs?: string[];
};
/** Upsert engine event types + metrics (`system: true`). English (default locale) only. */
export declare function seedAchievementCatalog(payload: Payload, scope?: string): Promise<void>;
/**
 * Idempotent upsert of achievement definitions by slug. Host supplies its own catalog and ladder data.
 */
export declare function seedAchievements(payload: Payload, input: AchievementSeedInput): Promise<void>;
//# sourceMappingURL=index.d.ts.map