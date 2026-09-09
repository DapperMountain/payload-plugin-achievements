import type { PayloadRequest } from 'payload';
export type ReleaseReviewGateResult = {
    requestsApproved: number;
    /** `tier.changed` rows written for users who newly resolve past the released gate. */
    tierLogsWritten?: number;
};
/**
 * When a definition stops requiring review, approve each pending request for that
 * definition so existing grant / tier.changed hooks run for that user + scope only.
 */
export declare function releasePendingAchievementReviews(args: {
    req: PayloadRequest;
    achievementId: string;
}): Promise<ReleaseReviewGateResult>;
/**
 * When a tier stops requiring review:
 * 1. Approve pending tier requests (their afterChange hooks sync `tier.changed`).
 * 2. Sync `tier.changed` for every (user, scope) that may now resolve to this rung —
 *    including members who already met unlock rules but never had a pending request
 *    (UI would otherwise show the new rank with no audit log until Repair).
 */
export declare function releasePendingTierReviews(args: {
    req: PayloadRequest;
    tierId: string;
}): Promise<ReleaseReviewGateResult>;
/** True when `requiresReview` flipped from required → not required. */
export declare function didDisableRequiresReview(previousDoc: {
    requiresReview?: boolean | null;
} | null | undefined, doc: {
    requiresReview?: boolean | null;
} | null | undefined): boolean;
//# sourceMappingURL=releaseReviewGate.d.ts.map