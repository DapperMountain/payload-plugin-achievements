import type { AchievementCollectionKey, AchievementPluginOptions } from '../types';
/**
 * Default slug prefix — always applied unless a per-collection `slugs` override is set.
 * Drives collection slug, REST `/api/{slug}`, and default DB table names.
 * Keeps plugin collections from colliding with host slugs.
 * Admin nav grouping is separate (`adminGroup`).
 */
export declare const DEFAULT_COLLECTION_PREFIX = "achievement";
/**
 * Base names combined with {@link DEFAULT_COLLECTION_PREFIX}.
 * Example: `definitions` → `achievement-definitions` (avoids `achievement-achievements`).
 */
export declare const DEFAULT_COLLECTION_BASE_SLUGS: Record<AchievementCollectionKey, string>;
export declare const DEFAULT_ADMIN_GROUP = "Achievements";
/**
 * Resolve final collection slugs from plugin options.
 * Per-key `collections.slugs` overrides are absolute (ignore `prefix`);
 * otherwise `${prefix}-${base}` with {@link DEFAULT_COLLECTION_PREFIX} when `prefix` is omitted.
 */
export declare function resolveCollectionSlugs(options?: AchievementPluginOptions): Record<AchievementCollectionKey, string>;
export declare function resolveAdminGroup(options?: AchievementPluginOptions): string | false;
//# sourceMappingURL=slugs.d.ts.map