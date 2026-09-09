import type { Payload, PayloadRequest } from 'payload';
export type ReconcileProgressionResult = {
    usersScanned: number;
    grantedLogsBackfilled: number;
    compositesGranted: number;
    achievementRequestsEnsured: number;
    tierRequestsEnsured: number;
    tierLogsWritten: number;
    metricBalancesRebuilt: number;
};
export type ReconcileProgressionArgs = {
    payload: Payload;
    req?: PayloadRequest;
    /** Limit to one member. */
    userId?: string | null;
    scopeId?: string | null;
    /** Limit discovery to grants / requests for this achievement (id or slug). */
    achievementId?: string | null;
    achievementSlug?: string | null;
    /** Limit discovery to tier requests for this tier (id or slug). */
    tierId?: string | null;
    tierSlug?: string | null;
    limit?: number;
};
/** Repair progression for one user (+ optional scope) from current grants + catalog. */
export declare function reconcileUserProgression(args: {
    payload: Payload;
    req?: PayloadRequest;
    userId: string;
    scopeId?: string | null;
}): Promise<Omit<ReconcileProgressionResult, 'usersScanned'>>;
/**
 * Scan matching (user, scope) pairs and repair progression.
 * Optional filters: `userId`, `scopeId`, `achievementId`/`achievementSlug`, `tierId`/`tierSlug`.
 */
export declare function reconcileProgression(args: ReconcileProgressionArgs): Promise<ReconcileProgressionResult>;
//# sourceMappingURL=reconcile.d.ts.map