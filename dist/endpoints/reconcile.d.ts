import type { Endpoint } from 'payload';
/**
 * `POST` repair progression from existing grants / requests.
 * Body (optional): `{ userId?, scopeId?, achievementId?, achievementSlug?, tierId?, tierSlug?, limit? }`.
 * Requires host `canReview`.
 */
export declare function buildReconcileEndpoint(path: string): Endpoint;
//# sourceMappingURL=reconcile.d.ts.map