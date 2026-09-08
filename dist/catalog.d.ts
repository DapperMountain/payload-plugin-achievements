export declare const ENGINE_EVENT_TYPES: readonly [{
    readonly slug: "achievement.granted";
    readonly name: "Achievement granted";
}, {
    readonly slug: "achievement.revoked";
    readonly name: "Achievement revoked";
}, {
    readonly slug: "metric.delta";
    readonly name: "Metric delta";
    readonly requiresMetric: true;
}, {
    readonly slug: "tier.changed";
    readonly name: "Tier changed";
}];
export declare const ENGINE_METRICS: readonly [{
    readonly slug: "points";
    readonly name: "Points";
}];
export type EngineEventTypeSlug = (typeof ENGINE_EVENT_TYPES)[number]['slug'];
export type EngineMetricSlug = (typeof ENGINE_METRICS)[number]['slug'];
export declare const DEFAULT_ACHIEVEMENT_METRIC_SLUG: EngineMetricSlug;
/** @deprecated Use {@link DEFAULT_ACHIEVEMENT_METRIC_SLUG}. */
export declare const DEFAULT_ACHIEVEMENT_METRIC: "points";
//# sourceMappingURL=catalog.d.ts.map