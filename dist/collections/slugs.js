/**
 * Default slug prefix — always applied unless a per-collection `slugs` override is set.
 * Drives collection slug, REST `/api/{slug}`, and default DB table names.
 * Keeps plugin collections from colliding with host slugs.
 * Admin nav grouping is separate (`adminGroup`).
 */
export const DEFAULT_COLLECTION_PREFIX = 'achievement';
/**
 * Base names combined with {@link DEFAULT_COLLECTION_PREFIX}.
 * Example: `definitions` → `achievement-definitions` (avoids `achievement-achievements`).
 */
export const DEFAULT_COLLECTION_BASE_SLUGS = {
    tiers: 'tiers',
    achievements: 'definitions',
    grants: 'grants',
    achievementRequests: 'requests',
    logs: 'logs',
    eventTypes: 'event-types',
    metrics: 'metrics',
};
export const DEFAULT_ADMIN_GROUP = 'Achievements';
/**
 * Resolve final collection slugs from plugin options.
 * Per-key `collections.slugs` overrides are absolute (ignore `prefix`);
 * otherwise `${prefix}-${base}` with {@link DEFAULT_COLLECTION_PREFIX} when `prefix` is omitted.
 */
export function resolveCollectionSlugs(options = {}) {
    const rawPrefix = options.collections?.prefix ?? options.slugPrefix;
    const prefix = typeof rawPrefix === 'string' && rawPrefix.trim()
        ? rawPrefix.trim()
        : DEFAULT_COLLECTION_PREFIX;
    const overrides = options.collections?.slugs ?? {};
    const slugs = {};
    for (const key of Object.keys(DEFAULT_COLLECTION_BASE_SLUGS)) {
        const override = overrides[key]?.trim();
        if (override) {
            slugs[key] = override;
            continue;
        }
        slugs[key] = `${prefix}-${DEFAULT_COLLECTION_BASE_SLUGS[key]}`;
    }
    return slugs;
}
export function resolveAdminGroup(options = {}) {
    if (options.collections?.adminGroup === false)
        return false;
    if (typeof options.collections?.adminGroup === 'string') {
        return options.collections.adminGroup;
    }
    return DEFAULT_ADMIN_GROUP;
}
