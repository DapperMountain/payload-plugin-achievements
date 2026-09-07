import type { Access, AccessArgs, PayloadRequest, Where } from 'payload';
type AccessResult = boolean | Where;
export type AccessFn = (args: AccessArgs) => AccessResult | Promise<AccessResult>;
export declare const allowAll: Access;
export declare const denyAll: Access;
export declare function requireOne(...fns: AccessFn[]): Access;
export declare function getUserId(req: PayloadRequest): string | null;
export {};
//# sourceMappingURL=index.d.ts.map