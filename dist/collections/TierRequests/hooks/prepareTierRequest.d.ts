import type { CollectionAfterChangeHook, CollectionBeforeValidateHook } from 'payload';
/**
 * System-created requests (reconcile / progression sync) may set user freely.
 * Member creates are not used for tiers in v1 — reviewers/system own the flow.
 */
export declare const prepareTierRequest: CollectionBeforeValidateHook;
export declare const afterTierRequestChange: CollectionAfterChangeHook;
//# sourceMappingURL=prepareTierRequest.d.ts.map