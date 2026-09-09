import type { Payload, PayloadRequest } from 'payload';
export type MetricDoc = {
    id?: unknown;
    slug?: string;
    kind?: string | null;
    compute?: string | null;
    unit?: string | null;
    since?: string | null;
    eventType?: unknown;
};
export declare function loadMetricDoc(args: {
    payload: Payload;
    req?: PayloadRequest;
    metric: string;
}): Promise<(MetricDoc & {
    id: string;
}) | null>;
/**
 * Current numeric value for a metric (stored balance or computed elapsed).
 */
export declare function resolveMetricValue(args: {
    payload: Payload;
    req?: PayloadRequest;
    /** Metric document id or slug, or a loaded metric doc. */
    metric: string | (MetricDoc & {
        id: string;
    });
    userId: string;
    scopeId: string | null;
    now?: Date;
}): Promise<number>;
//# sourceMappingURL=resolveMetricValue.d.ts.map