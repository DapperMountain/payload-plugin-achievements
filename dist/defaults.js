import { resolveAdminGroup, resolveCollectionSlugs, } from './collections/slugs.js';
export const DEFAULT_USERS_COLLECTION = 'users';
export const DEFAULT_ME_ENDPOINT_PATH = '/achievements/me';
export const DEFAULT_LEADERBOARD_ENDPOINT_PATH = '/achievements/leaderboard';
export const DEFAULT_RECONCILE_ENDPOINT_PATH = '/achievements/reconcile';
/** Unique, non-empty collection slugs from plugin `subjects.collections`. */
export function resolveSubjectCollections(options) {
    const raw = options?.subjects?.collections ?? [];
    const seen = new Set();
    const out = [];
    for (const slug of raw) {
        const trimmed = typeof slug === 'string' ? slug.trim() : '';
        if (!trimmed || seen.has(trimmed))
            continue;
        seen.add(trimmed);
        out.push(trimmed);
    }
    return out;
}
function normalizeEndpointPath(path, fallback) {
    const trimmed = path.trim();
    if (!trimmed)
        return fallback;
    return trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
}
export function resolveMeEndpointPath(me) {
    if (me === false)
        return false;
    if (me == null)
        return DEFAULT_ME_ENDPOINT_PATH;
    return normalizeEndpointPath(me, DEFAULT_ME_ENDPOINT_PATH);
}
export function resolveLeaderboardEndpointPath(path) {
    if (path === false)
        return false;
    if (path == null)
        return DEFAULT_LEADERBOARD_ENDPOINT_PATH;
    return normalizeEndpointPath(path, DEFAULT_LEADERBOARD_ENDPOINT_PATH);
}
export function resolveReconcileEndpointPath(path) {
    if (path === false)
        return false;
    if (path == null)
        return DEFAULT_RECONCILE_ENDPOINT_PATH;
    return normalizeEndpointPath(path, DEFAULT_RECONCILE_ENDPOINT_PATH);
}
export function resolveOptions(options = {}) {
    const { subjects: _subjects, ...rest } = options;
    return {
        ...rest,
        enabled: options.enabled !== false,
        seedSystemCatalog: options.seedSystemCatalog !== false,
        usersCollectionSlug: options.usersCollectionSlug ?? DEFAULT_USERS_COLLECTION,
        users: {
            includeJoins: options.users?.includeJoins !== false,
        },
        subjectCollections: resolveSubjectCollections(options),
        collectionSlugs: resolveCollectionSlugs(options),
        adminGroup: resolveAdminGroup(options),
        endpoints: {
            me: resolveMeEndpointPath(options.endpoints?.me),
            leaderboard: resolveLeaderboardEndpointPath(options.endpoints?.leaderboard),
            reconcile: resolveReconcileEndpointPath(options.endpoints?.reconcile),
        },
    };
}
