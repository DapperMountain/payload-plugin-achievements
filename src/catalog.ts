export const ENGINE_EVENT_TYPES = [
  { slug: 'achievement.granted', name: 'Achievement granted' },
  { slug: 'achievement.revoked', name: 'Achievement revoked' },
  { slug: 'metric.delta', name: 'Metric delta', requiresMetric: true },
  { slug: 'tier.changed', name: 'Tier changed' },
] as const

export const ENGINE_METRICS = [{ slug: 'points', name: 'Points' }] as const

export type EngineEventTypeSlug = (typeof ENGINE_EVENT_TYPES)[number]['slug']
export type EngineMetricSlug = (typeof ENGINE_METRICS)[number]['slug']

export const DEFAULT_ACHIEVEMENT_METRIC_SLUG: EngineMetricSlug = 'points'

/** @deprecated Use {@link DEFAULT_ACHIEVEMENT_METRIC_SLUG}. */
export const DEFAULT_ACHIEVEMENT_METRIC = DEFAULT_ACHIEVEMENT_METRIC_SLUG
