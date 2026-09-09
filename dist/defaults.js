import { resolveAdminGroup, resolveCollectionSlugs, } from './collections/slugs.js';
export const DEFAULT_USERS_COLLECTION = 'users';
export const DEFAULT_ME_ENDPOINT_PATH = '/achievements/me';
export const DEFAULT_RECONCILE_ENDPOINT_PATH = '/achievements/reconcile';
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
export function resolveReconcileEndpointPath(path) {
    if (path === false)
        return false;
    if (path == null)
        return DEFAULT_RECONCILE_ENDPOINT_PATH;
    return normalizeEndpointPath(path, DEFAULT_RECONCILE_ENDPOINT_PATH);
}
export function resolveOptions(options = {}) {
    return {
        ...options,
        enabled: options.enabled !== false,
        usersCollectionSlug: options.usersCollectionSlug ?? DEFAULT_USERS_COLLECTION,
        users: {
            includeJoins: options.users?.includeJoins !== false,
        },
        collectionSlugs: resolveCollectionSlugs(options),
        adminGroup: resolveAdminGroup(options),
        endpoints: {
            me: resolveMeEndpointPath(options.endpoints?.me),
            reconcile: resolveReconcileEndpointPath(options.endpoints?.reconcile),
        },
    };
}
