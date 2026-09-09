import type { PaginatedDocs, Payload, PayloadRequest } from 'payload';
/** Catalog slice — `description` matches the collection (Lexical JSON, or legacy string). */
type LeanCatalog = {
    id: string;
    name?: string;
    slug?: string;
    description?: unknown;
};
type LeanTier = LeanCatalog & {
    rank?: number;
    scopeId?: string | null;
};
export type GetUserProgressPaging = {
    limit?: number;
    page?: number;
    requestsLimit?: number;
};
declare function leanGrant(doc: Record<string, unknown>): {
    id: unknown;
    achievement: LeanCatalog | null;
    completedAt: {} | null;
    note: {} | null;
    scopeId: string | null;
    updatedAt: {} | null;
    createdAt: {} | null;
};
declare function leanRequest(doc: Record<string, unknown>): {
    id: unknown;
    status: {} | null;
    achievement: LeanCatalog | null;
    reason: {} | null;
    updatedAt: {} | null;
    createdAt: {} | null;
};
export type UserProgressMeResponse = PaginatedDocs<ReturnType<typeof leanGrant>> & {
    /** Ladder-derived current tier(s). */
    tiers: LeanTier[];
    requests: ReturnType<typeof leanRequest>[];
};
/**
 * Current-user snapshot. Top-level Payload `find` shape for **grants**;
 * ladder-derived `tiers` and lean `requests` ride along.
 */
export declare function getUserProgress(args: {
    payload: Payload;
    req?: PayloadRequest;
    userId: string;
    scopeId?: string | null;
    paging?: GetUserProgressPaging;
    /** Content locale for localized achievement / tier names (falls back to `req.locale`). */
    locale?: string;
}): Promise<UserProgressMeResponse>;
export {};
//# sourceMappingURL=getUserProgress.d.ts.map