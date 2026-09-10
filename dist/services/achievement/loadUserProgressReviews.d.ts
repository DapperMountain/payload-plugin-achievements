import type { Payload, PayloadRequest } from 'payload';
export type UserProgressTierRequest = {
    id: string;
    status: 'pending' | 'rejected';
    tierId: string | null;
};
export type UserProgressReviews = {
    /** Achievement definition ids and slugs with a pending request. */
    pendingAchievementKeys: string[];
    /** Open or rejected tier requests (host decides which badge wins). */
    tierRequests: UserProgressTierRequest[];
};
/**
 * Review-queue snapshot for member UI (pending achievement keys + open/rejected tier requests).
 * Does not decide ready/rejected presentation — hosts apply ladder context themselves.
 */
export declare function loadUserProgressReviews(args: {
    payload: Payload;
    req?: PayloadRequest;
    userId: string;
    scopeId?: string | null;
}): Promise<UserProgressReviews>;
//# sourceMappingURL=loadUserProgressReviews.d.ts.map