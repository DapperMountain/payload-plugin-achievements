import type { Payload, PayloadRequest } from 'payload';
import { type ResolvedTier } from './resolveCurrentTier.js';
export type TierLadderProgress = {
    current: ResolvedTier | null;
    next: ResolvedTier | null;
    /** 0..1 progress toward unlocking `next` (1 when there is no next tier). */
    progressTowardNext: number;
    /**
     * 0..1 position along the ordered ladder for UI tracks:
     * `(currentIndex + progressTowardNext) / (tierCount - 1)`.
     * When no current tier yet, uses `progressTowardNext / (tierCount - 1)`.
     */
    ladderProgress: number;
    tiers: Array<{
        id: string;
        name?: string;
        slug?: string;
        rank: number;
    }>;
};
/**
 * Current tier, next tier, and fractional progress toward the next unlock rules.
 *
 * Progress uses {@link evaluateRuleProgress}: AND averages requirement children equally
 * (`tier-at-least` is a gate and is skipped). Nested `achievement-complete` rules roll
 * up eligibility progress when the child is not yet granted.
 */
export declare function resolveTierProgress(args: {
    payload: Payload;
    req?: PayloadRequest;
    userId: string;
    scopeId?: string | null;
    locale?: string;
}): Promise<TierLadderProgress>;
//# sourceMappingURL=resolveTierProgress.d.ts.map