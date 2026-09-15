import type { Payload, PayloadRequest } from 'payload';
export type ActorTierSnapshotRow = {
    scope?: string | null;
    tier: string;
    rank: number;
};
/**
 * Unscoped logs stamp every ladder (a later scoped count can still see the actor’s rank).
 * Scoped logs stamp that tenant plus any unscoped ranks.
 */
export declare function scopeIdsForActorSnapshot(args: {
    logScopeId: string | null;
    ladderScopeIds: Array<string | null>;
}): Array<string | null>;
/** Normalize log `actorTiers` rows for matching. */
export declare function readActorTierSnapshotRows(value: unknown): Array<{
    scopeId: string | null;
    rank: number;
}>;
/**
 * True when a snapshot includes this scope at rank ≥ `minimumRank`.
 * Missing snapshot (legacy logs) never matches — the event was not stamped.
 */
export declare function actorSnapshotMeetsTier(args: {
    rows: unknown;
    scopeId: string | null;
    minimumRank: number;
}): boolean;
/**
 * Read-only derived ladder ranks for an actor across configured scopes.
 * Does not reconcile, grant, or open tier requests.
 */
export declare function snapshotActorDerivedTiers(args: {
    payload: Payload;
    req?: PayloadRequest;
    userId: string;
    /** Log `scope` — `null` stamps every ladder scope. */
    logScopeId?: string | null;
}): Promise<ActorTierSnapshotRow[]>;
//# sourceMappingURL=actorTierSnapshot.d.ts.map