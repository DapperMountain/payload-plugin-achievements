import type { PayloadRequest } from 'payload';
export type RuleGroup = {
    combinator?: 'and' | 'or' | null;
    rules?: Record<string, unknown>[] | null;
};
export declare function normalizeRuleGroup(input: RuleGroup | Record<string, unknown>[] | null | undefined): {
    combinator: 'and' | 'or';
    rules: Record<string, unknown>[];
};
/** True when the tree has at least one non-gate requirement (nested achievements, counts, metrics). */
export declare function ruleGroupHasProgressRequirements(input: RuleGroup | Record<string, unknown>[] | null | undefined): boolean;
export type AchievementCompleteRef = {
    id: string | null;
    slug: string;
};
/**
 * Achievement-complete leaves in document order (nested groups included).
 * First appearance wins when the same achievement is listed twice.
 */
export declare function collectAchievementCompleteRefs(input: RuleGroup | Record<string, unknown>[] | null | undefined): AchievementCompleteRef[];
export declare function evaluateRules(args: {
    payload: PayloadRequest['payload'];
    req: PayloadRequest;
    rules: RuleGroup | Record<string, unknown>[] | null | undefined;
    userId: string;
    scopeId: string | null;
    /** Rank unlocked so far during a ladder walk (`null` = none). */
    ladderRank?: number | null;
}): Promise<boolean>;
/**
 * Fractional progress (0..1) toward satisfying a rule tree.
 *
 * Derived from the tree — no catalog `weight` field:
 * - **AND**: equal average of *requirement* children (`tier-at-least` is a gate and is skipped).
 * - **OR**: best child (max).
 * - Leaves: rule-type `progress` when provided; `achievement-complete` rolls up nested
 *   eligibility when the grant is missing; otherwise `evaluate` → 0|1.
 */
export declare function evaluateRuleProgress(args: {
    payload: PayloadRequest['payload'];
    req: PayloadRequest;
    rules: RuleGroup | Record<string, unknown>[] | null | undefined;
    userId: string;
    scopeId: string | null;
    ladderRank?: number | null;
    progressVisited?: Set<string>;
}): Promise<number>;
//# sourceMappingURL=evaluateRules.d.ts.map