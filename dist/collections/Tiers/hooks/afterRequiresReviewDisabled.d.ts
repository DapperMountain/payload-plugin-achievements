import type { CollectionAfterChangeHook } from 'payload';
/**
 * When Requires review is turned off, approve pending tier requests and sync
 * `tier.changed` for members who already met unlock rules (including those with
 * no pending request — otherwise the UI advances with no audit until Repair).
 */
export declare const afterRequiresReviewDisabled: CollectionAfterChangeHook;
//# sourceMappingURL=afterRequiresReviewDisabled.d.ts.map