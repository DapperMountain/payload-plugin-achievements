import type { Payload, PayloadRequest } from 'payload';
/**
 * Resolve the start timestamp for elapsed rules / computed metrics.
 * Built-ins: `user-created-at`, `first-event`. Host keys: `extensions.metricAnchors`.
 */
export declare function resolveElapsedAnchor(args: {
    payload: Payload;
    req?: PayloadRequest;
    since?: unknown;
    eventType?: unknown;
    eventTypeSlug?: unknown;
    userId: string;
    scopeId: string | null;
}): Promise<Date | null>;
//# sourceMappingURL=resolveElapsedAnchor.d.ts.map