import type { PayloadRequest } from 'payload';
/**
 * Create an achievement request (or auto-approved grant) via the collection.
 * Hooks bind the requesting user, check eligibility, and grant when approved.
 */
export declare function submitAchievementRequest(args: {
    req: PayloadRequest;
    userId: string;
    achievementId: string;
    scopeId?: string | null;
    note?: string;
}): Promise<import("payload").JsonObject & import("payload").TypeWithID>;
/** Create a grant row, emit achievement.granted, sync tier.changed when the ladder moves. */
export declare function grantAchievement(args: {
    req: PayloadRequest;
    userId: string;
    achievementId: string;
    scopeId?: string | null;
    note?: string | null;
}): Promise<import("payload").JsonObject & import("payload").TypeWithID>;
//# sourceMappingURL=submitAchievementRequest.d.ts.map