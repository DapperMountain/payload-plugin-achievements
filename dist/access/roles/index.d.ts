import type { AccessArgs } from 'payload';
import type { AchievementCollectionKey } from '../../types';
/** Authenticated user may read/write rows tied to themselves. */
export declare const isSelfUser: (userRelationField?: string) => ({ req, data }: AccessArgs) => boolean | {
    [x: string]: {
        equals: string;
    };
};
/**
 * Host `canReview` policy. When unset, privileged writes are denied (safe default).
 * Passes document scope when available (from `data.scope` or loaded by id).
 */
export declare const isReviewer: (collectionKey?: AchievementCollectionKey) => (args: AccessArgs) => Promise<boolean>;
export declare const isAuthenticated: ({ req }: AccessArgs) => boolean;
//# sourceMappingURL=index.d.ts.map