import type { PayloadRequest } from 'payload';
export { CTX_CASCADING_REVOKE, CTX_SKIP_GRANT_SIDE_EFFECTS, CTX_SYSTEM_REQUEST } from './contextFlags';
/** Create a grant row only — side effects run in Grants afterChange. */
export declare function createGrantRow(args: {
    req: PayloadRequest;
    userId: string;
    achievementId: string;
    scopeId?: string | null;
    note?: string | null;
    completedAt?: string;
}): Promise<Record<string, unknown>>;
/** Ensure a pending achievement request exists (system / reconcile path). */
export declare function ensureAchievementRequest(args: {
    req: PayloadRequest;
    userId: string;
    achievementId: string;
    scopeId?: string | null;
}): Promise<{
    doc: Record<string, unknown>;
    created: boolean;
}>;
/**
 * Auto-grant or open a request for composed achievements whose completion rules pass.
 */
export declare function syncCompositeProgression(args: {
    req: PayloadRequest;
    userId: string;
    scopeId: string | null;
}): Promise<{
    granted: number;
    requested: number;
}>;
/** Delete grants for composed achievements that no longer pass completion rules. */
export declare function revokeIncompleteComposites(args: {
    req: PayloadRequest;
    userId: string;
    scopeId: string | null;
}): Promise<number>;
export declare function runAfterGrantCreated(args: {
    req: PayloadRequest;
    userId: string;
    achievementId: string;
    scopeId: string | null;
    achievementSlug?: string;
}): Promise<void>;
export declare function runAfterGrantDeleted(args: {
    req: PayloadRequest;
    userId: string;
    achievementId: string;
    scopeId: string | null;
    achievementSlug?: string;
    cascading?: boolean;
}): Promise<void>;
//# sourceMappingURL=grantSideEffects.d.ts.map