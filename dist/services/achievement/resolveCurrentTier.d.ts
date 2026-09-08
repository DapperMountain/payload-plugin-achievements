import type { Payload, PayloadRequest } from 'payload';
export type ResolvedTier = {
    id: string;
    name?: string;
    slug?: string;
    rank: number;
    scopeId: string | null;
};
/**
 * Derive current tier by walking unlock rules in rank order (lowest first).
 * Empty unlock rules pass. Tiers with `requiresReview` only count once an approved tier request exists.
 */
export declare function resolveCurrentTier(args: {
    payload: Payload;
    req?: PayloadRequest;
    userId: string;
    scopeId?: string | null;
    /** Content locale for localized tier names (falls back to `req.locale`). */
    locale?: string;
}): Promise<ResolvedTier | null>;
//# sourceMappingURL=resolveCurrentTier.d.ts.map