/**
 * Layer host overrides on a plugin collection:
 * - `access` / `admin` / `labels`: shallow merge (host wins per key)
 * - `hooks`: append host hook arrays after the plugin’s (plugin runs first)
 */
export function applyCollectionOverrides(collection, override) {
    if (!override)
        return collection;
    const hooks = { ...(collection.hooks ?? {}) };
    if (override.hooks) {
        for (const key of Object.keys(override.hooks)) {
            const hostHooks = override.hooks[key];
            if (hostHooks == null)
                continue;
            const existing = hooks[key];
            const base = (Array.isArray(existing) ? existing : existing ? [existing] : []);
            const extra = (Array.isArray(hostHooks) ? hostHooks : [hostHooks]);
            hooks[key] = [...base, ...extra];
        }
    }
    return {
        ...collection,
        access: {
            ...collection.access,
            ...override.access,
        },
        admin: {
            ...collection.admin,
            ...override.admin,
        },
        ...(override.labels ? { labels: override.labels } : {}),
        hooks,
    };
}
