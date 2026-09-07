import type { Where } from 'payload';
/** User (+ optional scope) filter without optional keys that break Where typing. */
export declare function userScopeWhere(userId: string, scopeId: string | null): Where;
/**
 * Like {@link userScopeWhere}, but when `scopeId` is set also includes logs with no scope
 * (also matches rows with no scope — e.g. global events that still count toward a scoped ladder).
 */
export declare function userScopeIncludingUnscopedWhere(userId: string, scopeId: string | null): Where;
//# sourceMappingURL=where.d.ts.map