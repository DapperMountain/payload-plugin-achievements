import type { CollectionAfterChangeHook, CollectionBeforeValidateHook } from 'payload';
/**
 * Create: bind the requesting user, enforce eligibility,
 * auto-approve when the definition does not require review.
 * Update: status transitions handled in afterChange.
 */
export declare const prepareAchievementRequest: CollectionBeforeValidateHook;
/**
 * When a request becomes approved, grant the achievement (create or pending→approved).
 */
export declare const grantOnApprovedRequest: CollectionAfterChangeHook;
//# sourceMappingURL=prepareAchievementRequest.d.ts.map