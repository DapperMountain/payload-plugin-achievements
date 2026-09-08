import type { Payload, PayloadRequest } from 'payload';
export type ReconcileProgressionResult = {
    usersScanned: number;
    grantedLogsBackfilled: number;
    compositesGranted: number;
    achievementRequestsEnsured: number;
    tierRequestsEnsured: number;
    tierLogsWritten: number;
};
/** Repair progression for one user (+ optional scope) from current grants + catalog. */
export declare function reconcileUserProgression(args: {
    payload: Payload;
    req?: PayloadRequest;
    userId: string;
    scopeId?: string | null;
}): Promise<Omit<ReconcileProgressionResult, 'usersScanned'>>;
/** Scan grants and reconcile each distinct (user, scope) pair. */
export declare function reconcileProgression(args: {
    payload: Payload;
    req?: PayloadRequest;
    scopeId?: string | null;
    limit?: number;
}): Promise<ReconcileProgressionResult>;
//# sourceMappingURL=reconcile.d.ts.map