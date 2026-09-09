import type { PayloadRequest } from 'payload';
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
 * When unlock rules pass and the tier requires review, ensure a pending/approved request exists.
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