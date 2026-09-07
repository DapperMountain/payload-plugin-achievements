import { slugOf } from './collections/helpers';
import { getAchievementOptions } from './options-store';
/** True when the plugin is opted in and its collections are on this Payload config. */
export function isAchievementPluginEnabled(payload) {
    if (!getAchievementOptions().enabled)
        return false;
    const slug = slugOf('logs');
    return Boolean(payload.config.collections?.some((collection) => collection.slug === slug));
}
