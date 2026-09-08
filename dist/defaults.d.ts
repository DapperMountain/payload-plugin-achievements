import type { AchievementPluginOptions } from './types';
import { resolveCollectionSlugs } from './collections/slugs';
export declare const DEFAULT_USERS_COLLECTION = "users";
export declare const DEFAULT_ME_ENDPOINT_PATH = "/achievements/me";
export declare const DEFAULT_RECONCILE_ENDPOINT_PATH = "/achievements/reconcile";
export type ResolvedAchievementOptions = Omit<AchievementPluginOptions, 'users' | 'endpoints'> & {
    enabled: boolean;
    usersCollectionSlug: string;
    users: {
        includeJoins: boolean;
    };
    /** Resolved collection slug map (after prefix + overrides). */
    collectionSlugs: ReturnType<typeof resolveCollectionSlugs>;
    /** Admin nav group for plugin collections (`false` = ungrouped). */
    adminGroup: string | false;
    endpoints: {
        me: string | false;
        reconcile: string | false;
    };
};
export declare function resolveMeEndpointPath(me?: string | false): string | false;
export declare function resolveReconcileEndpointPath(path?: string | false): string | false;
export declare function resolveOptions(options?: AchievementPluginOptions): ResolvedAchievementOptions;
//# sourceMappingURL=defaults.d.ts.map