export const ENGINE_EVENT_TYPES = [
    { slug: 'achievement.granted', name: 'Achievement granted' },
    { slug: 'achievement.revoked', name: 'Achievement revoked' },
    { slug: 'metric.delta', name: 'Metric delta', requiresMetric: true },
    { slug: 'tier.changed', name: 'Tier changed' },
];
export const ENGINE_METRICS = [{ slug: 'points', name: 'Points', kind: 'stored' }];
export const DEFAULT_ACHIEVEMENT_METRIC_SLUG = 'points';
/** @deprecated Use {@link DEFAULT_ACHIEVEMENT_METRIC_SLUG}. */
export const DEFAULT_ACHIEVEMENT_METRIC = DEFAULT_ACHIEVEMENT_METRIC_SLUG;
