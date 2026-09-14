import type { AchievementPluginOptions } from './types.js';
import { resolveCollectionSlugs } from './collections/slugs.js';
export declare const DEFAULT_USERS_COLLECTION = "users";
export declare const DEFAULT_ME_ENDPOINT_PATH = "/achievements/me";
export declare const DEFAULT_LEADERBOARD_ENDPOINT_PATH = "/achievements/leaderboard";
export declare const DEFAULT_RECONCILE_ENDPOINT_PATH = "/achievements/reconcile";
export type ResolvedAchievementOptions = Omit<AchievementPluginOptions, 'users' | 'endpoints' | 'subjects'> & {
    enabled: boolean;
    seedSystemCatalog: boolean;
    usersCollectionSlug: string;
    users: {
        includeJoins: boolean;
    };
    /** Host collections allowed as polymorphic log subjects (empty = feature off). */
    subjectCollections: string[];
    /** Resolved collection slug map (after prefix + overrides). */
    collectionSlugs: ReturnType<typeof resolveCollectionSlugs>;
    /** Admin nav group for plugin collections (`false` = ungrouped). */
    adminGroup: string | false;
    endpoints: {
        me: string | false;
        leaderboard: string | false;
        reconcile: string | false;
    };
};
/** Unique, non-empty collection slugs from plugin `subjects.collections`. */
export declare function resolveSubjectCollections(options?: AchievementPluginOptions): string[];
export declare function resolveMeEndpointPath(me?: string | false): string | false;
export declare function resolveLeaderboardEndpointPath(path?: string | false): string | false;
export declare function resolveReconcileEndpointPath(path?: string | false): string | false;
export declare function resolveOptions(options?: AchievementPluginOptions): ResolvedAchievementOptions;
//# sourceMappingURL=defaults.d.ts.map