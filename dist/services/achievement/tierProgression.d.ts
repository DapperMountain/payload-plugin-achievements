import type { PayloadRequest } from 'payload';
/**
 * Ensure a tier request exists when unlock rules pass.
 * Prefer open (pending/approved) rows. If only a **rejected** request exists,
 * leave it alone — do not auto-queue a new pending after a denial.
 */
export declare function ensureTierRequest(args: {
    req: PayloadRequest;
    userId: string;
    tierId: string;
    scopeId: string | null;
}): Promise<{
    doc: Record<string, unknown>;
    created: boolean;
}>;
/**
 * When unlock rules pass and the tier requires review, ensure a request exists.
 * Does not recreate a request after rejection — reopen by updating that row or creating manually.
 */
export declare function syncTierProgression(args: {
    req: PayloadRequest;
    userId: string;
    scopeId: string | null;
}): Promise<{
    requested: number;
}>;
export { hasApprovedTierRequest } from './tierApproval.js';
//# sourceMappingURL=tierProgression.d.ts.map