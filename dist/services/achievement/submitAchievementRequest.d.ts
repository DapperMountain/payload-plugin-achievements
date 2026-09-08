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
/**
 * Create a grant row. Side effects (logs, composites, tiers) run in Grants hooks.
 */
export declare function grantAchievement(args: {
    req: PayloadRequest;
    userId: string;
    achievementId: string;
    scopeId?: string | null;
    note?: string | null;
}): Promise<Record<string, unknown>>;
//# sourceMappingURL=submitAchievementRequest.d.ts.map