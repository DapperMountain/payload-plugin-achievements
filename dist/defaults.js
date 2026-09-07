import { resolveAdminGroup, resolveCollectionSlugs, } from './collections/slugs';
export const DEFAULT_USERS_COLLECTION = 'users';
export const DEFAULT_ME_ENDPOINT_PATH = '/achievements/me';
function normalizeEndpointPath(path) {
    const trimmed = path.trim();
    if (!trimmed)
        return DEFAULT_ME_ENDPOINT_PATH;
    return trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
}
export function resolveMeEndpointPath(me) {
    if (me === false)
        return false;
    if (me == null)
        return DEFAULT_ME_ENDPOINT_PATH;
    return normalizeEndpointPath(me);
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
        },
    };
}
