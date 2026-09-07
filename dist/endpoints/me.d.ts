import type { Endpoint } from 'payload';
/**
 * `GET` current user’s snapshot. Body is Payload `find`-shaped for **grants**,
 * plus ladder-derived `tiers` and lean `requests`. Optional `?scope=` / `limit` / `page`.
 */
export declare function buildMeEndpoint(path: string): Endpoint;
//# sourceMappingURL=me.d.ts.map