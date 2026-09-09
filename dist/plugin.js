import { buildAchievementCollections } from './collections/index.js';
import { usersAchievementsGroup } from './collections/fields/usersAchievementsGroup.js';
import { resolveOptions } from './defaults.js';
import { buildAchievementEndpoints } from './endpoints/index.js';
import { setAchievementOptions } from './options-store.js';
/**
 * Payload achievements plugin — merges collections (hooks own request/grant flow)
 * and an optional current-user grants endpoint.
 */
export const achievementPlugin = (options = {}) => (config) => {
    const resolved = resolveOptions(options);
    setAchievementOptions(resolved);
    if (!resolved.enabled)
        return config;
    const achievementCollections = buildAchievementCollections();
    const usersSlug = resolved.usersCollectionSlug;
    const collections = (config.collections ?? []).map((collection) => {
        if (collection.slug !== usersSlug || resolved.users?.includeJoins === false) {
            return collection;
        }
        return {
            ...collection,
            fields: [...(collection.fields ?? []), usersAchievementsGroup(resolved)],
        };
    });
    const incomingOnInit = config.onInit;
    return {
        ...config,
        collections: [...collections, ...achievementCollections],
        endpoints: [...(config.endpoints ?? []), ...buildAchievementEndpoints(resolved)],
        onInit: async (payload) => {
            if (incomingOnInit)
                await incomingOnInit(payload);
            if (resolved.seedSystemCatalog) {
                const { seedAchievementCatalog } = await import('./seed/index.js');
                await seedAchievementCatalog(payload);
            }
        },
    };
};
