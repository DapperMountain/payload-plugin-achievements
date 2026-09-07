import type { CollectionConfig } from 'payload';
import type { AchievementCollectionOverride } from '../types';
/**
 * Layer host overrides on a plugin collection:
 * - `access` / `admin` / `labels`: shallow merge (host wins per key)
 * - `hooks`: append host hook arrays after the plugin’s (plugin runs first)
 */
export declare function applyCollectionOverrides(collection: CollectionConfig, override?: AchievementCollectionOverride): CollectionConfig;
//# sourceMappingURL=applyOverrides.d.ts.map