import type { PayloadRequest } from 'payload';
export type ReleaseReviewGateResult = {
    requestsApproved: number;
};
/**
 * When a definition stops requiring review, approve each pending request for that
 * definition so existing grant / tier.changed hooks run for that user + scope only.
 */
export declare function releasePendingAchievementReviews(args: {
    req: PayloadRequest;
    achievementId: string;
}): Promise<ReleaseReviewGateResult>;
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