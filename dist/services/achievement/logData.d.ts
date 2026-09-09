/**
 * Shared engine shape for achievement-log `data` on system event types.
 * Hosts may add extra keys; readers should treat unknown keys as opaque.
 *
 * Transition events always use `from` / `to` (either side may be null):
 * - `tier.changed` — previous ladder step → current step
 * - `achievement.granted` — `from: null`, `to: achievement`
 * - `achievement.revoked` — `from: achievement`, `to: null`
 */
export type CatalogRef = {
    id: string;
    slug?: string;
};
export type TransitionLogData = {
    from: CatalogRef | null;
    to: CatalogRef | null;
};
export declare function catalogRef(id: string, slug?: string | null): CatalogRef;
export declare function transitionLogData(args: {
    from?: {
        id: string;
        slug?: string | null;
    } | null;
    to?: {
        id: string;
        slug?: string | null;
    } | null;
}): TransitionLogData;
/** Read the “current” catalog id from a log `data` blob (new or legacy shapes). */
export declare function transitionToId(data: unknown): string | null;
//# sourceMappingURL=logData.d.ts.map