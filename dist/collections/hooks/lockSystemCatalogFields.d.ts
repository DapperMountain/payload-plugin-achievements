import type { CollectionBeforeChangeHook } from 'payload';
/**
 * System catalog rows keep a fixed slug and stay marked system on update
 * so engine lookups by slug cannot be broken from Admin.
 */
export declare const lockSystemCatalogFields: CollectionBeforeChangeHook;
//# sourceMappingURL=lockSystemCatalogFields.d.ts.map