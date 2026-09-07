import type { PayloadRequest } from 'payload';
/**
 * Approve or reject via collection update. Grant runs in afterChange when approved.
 */
export declare function reviewAchievementRequest(args: {
    req: PayloadRequest;
    requestId: string;
    decision: 'approved' | 'rejected';
    note?: string;
}): Promise<import("payload").JsonObject & import("payload").TypeWithID>;
//# sourceMappingURL=reviewAchievementRequest.d.ts.map