import { getAchievementOptions } from '../options-store';
/** Resolved slug for a logical achievement collection. */
export function slugOf(key) {
    return getAchievementOptions().collectionSlugs[key];
}
/**
 * Local API / relationship target. Host `generate:types` owns the real CollectionSlug union;
 * plugins cast loosely at the boundary.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any -- host owns CollectionSlug
export function collectionOf(key) {
    return slugOf(key);
}
/** Drop nullish optional fields (e.g. scope when unset). */
export function optionalFields(...fields) {
    return fields.filter((field) => field != null);
}
/** Admin defaultColumns — strips `scope` when the host did not configure a scope collection. */
export function columnsWithOptionalScope(columns) {
    if (getAchievementOptions().scope?.collection)
        return columns;
    return columns.filter((column) => column !== 'scope');
}
/** Shared admin bits (sidebar group + caller overrides). */
export function collectionAdmin(admin) {
    const group = getAchievementOptions().adminGroup;
    return {
        ...admin,
        ...(group === false ? {} : { group }),
    };
}
