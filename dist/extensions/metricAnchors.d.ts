import type { OptionLabel } from 'payload';
import type { AchievementMetricAnchor, AchievementMetricAnchorEntry } from '../types.js';
export declare function resolveMetricAnchorEntry(entry: AchievementMetricAnchorEntry, key: string): {
    label: OptionLabel;
    resolve: AchievementMetricAnchor;
};
export declare function getMetricAnchorEntries(): Array<{
    key: string;
    label: OptionLabel;
    resolve: AchievementMetricAnchor;
}>;
export declare function getMetricAnchorResolver(key: string): AchievementMetricAnchor | null;
//# sourceMappingURL=metricAnchors.d.ts.map