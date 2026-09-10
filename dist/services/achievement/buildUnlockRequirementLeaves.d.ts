import type { Payload, PayloadRequest } from 'payload';
export declare const UNLOCK_REQUIREMENT_RELATION_FIELDS: {
    readonly tier: "tiers";
    readonly achievement: "achievements";
    readonly metric: "metrics";
    readonly eventType: "eventTypes";
};
export type UnlockRequirementCollectionKey = (typeof UNLOCK_REQUIREMENT_RELATION_FIELDS)[keyof typeof UNLOCK_REQUIREMENT_RELATION_FIELDS];
export type UnlockRequirementRelation = {
    field: keyof typeof UNLOCK_REQUIREMENT_RELATION_FIELDS;
    collectionKey: UnlockRequirementCollectionKey;
    id?: string;
    slug?: string;
    name?: string;
};
/**
 * Structured unlock/eligibility leaf — catalog names only, no host UI copy.
 * Hosts format `label` / `detail` from these fields.
 */
export type UnlockRequirementLeaf = {
    id: string;
    type: string;
    met: boolean;
    /** 0..1 from {@link evaluateRuleProgress}. */
    progress: number;
    relations: UnlockRequirementRelation[];
    target?: number;
    unit?: string;
    since?: string;
};
/**
 * Walk every leaf in a rule tree, evaluate met/progress, and return catalog-backed
 * subjects. Payload rows often carry empty `rules: []` + default combinator — those
 * are still leaves ({@link eachRuleLeaf}).
 *
 * `achievement-complete` is omitted by default so hosts can keep those on catalog groups.
 */
export declare function buildUnlockRequirementLeaves(args: {
    payload: Payload;
    req?: PayloadRequest;
    userId: string;
    scopeId: string | null;
    rules: unknown;
    ladderRank?: number | null;
    locale?: string;
    includeAchievementComplete?: boolean;
}): Promise<UnlockRequirementLeaf[]>;
//# sourceMappingURL=buildUnlockRequirementLeaves.d.ts.map