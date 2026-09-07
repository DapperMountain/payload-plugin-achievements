import type { Payload, PayloadRequest } from 'payload';
import type { AchievementCollectionKey } from '../../types';
type CatalogKey = Extract<AchievementCollectionKey, 'eventTypes' | 'metrics'>;
/**
 * Resolve a catalog relationship from a slug or document id.
 */
export declare function resolveCatalogId(args: {
    payload: Payload;
    req?: PayloadRequest;
    key: CatalogKey;
    slugOrId: string;
}): Promise<string>;
export {};
//# sourceMappingURL=resolveCatalog.d.ts.map