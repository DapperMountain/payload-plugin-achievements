import { buildAchievementCollections } from './collections/index';
import { usersAchievementsGroup } from './collections/fields/usersAchievementsGroup';
import { resolveOptions } from './defaults';
import { buildAchievementEndpoints } from './endpoints/index';
import { setAchievementOptions } from './options-store';
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
    return {
        ...config,
        collections: [...collections, ...achievementCollections],
        endpoints: [...(config.endpoints ?? []), ...buildAchievementEndpoints(resolved)],
    };
};
