import type { CollectionConfig, Field } from 'payload';
import type { AchievementCollectionKey } from '../types';
/** Resolved slug for a logical achievement collection. */
export declare function slugOf(key: AchievementCollectionKey): string;
/**
 * Local API / relationship target. Host `generate:types` owns the real CollectionSlug union;
 * plugins cast loosely at the boundary.
 */
export declare function collectionOf(key: AchievementCollectionKey): any;
/** Drop nullish optional fields (e.g. scope when unset). */
export declare function optionalFields(...fields: Array<Field | null | undefined>): Field[];
/** Admin defaultColumns — strips `scope` when the host did not configure a scope collection. */
export declare function columnsWithOptionalScope(columns: string[]): string[];
/** Shared admin bits (sidebar group + caller overrides). */
export declare function collectionAdmin(admin: NonNullable<CollectionConfig['admin']>): NonNullable<CollectionConfig['admin']>;
//# sourceMappingURL=helpers.d.ts.map