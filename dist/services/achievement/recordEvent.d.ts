import type { Payload, PayloadRequest } from 'payload';
import { type LogSubjectRef } from './logSubject.js';
export type RecordLogInput = {
    payload: Payload;
    req?: PayloadRequest;
    userId: string;
    scopeId?: string | null;
    /** Log-type catalog slug (preferred) or document id. */
    type: string;
    actorId?: string | null;
    /** Metric catalog slug (preferred) or document id. */
    metric?: string;
    /** Signed amount the metric moved (for metric.delta logs). */
    change?: number;
    reason?: string;
    /**
     * Host document this entry is about (polymorphic).
     * Preferred over stuffing ids into `data` when the host configured `subjects.collections`.
     */
    subject?: LogSubjectRef | null;
    data?: Record<string, unknown> | null;
};
/** Append a catalogued occurrence to the achievement log. */
export declare function recordLog(args: RecordLogInput): Promise<import("payload").JsonObject & import("payload").TypeWithID>;
/** @deprecated Prefer {@link recordLog}. */
export declare const recordEvent: typeof recordLog;
/**
 * Record `metric.delta`, then sync an optional `tier.changed` audit log.
 */
export declare function recordMetricChange(args: {
    payload: Payload;
    req?: PayloadRequest;
    userId: string;
    scopeId?: string | null;
    metric?: string;
    change: number;
    reason?: string;
    actorId?: string | null;
}): Promise<import("payload").JsonObject & import("payload").TypeWithID>;
/** Write `tier.changed` when the ladder-derived tier differs from the latest audit entry. */
export declare function syncTierChangedLog(args: {
    payload: Payload;
    req?: PayloadRequest;
    userId: string;
    scopeId?: string | null;
}): Promise<(import("payload").JsonObject & import("payload").TypeWithID) | null>;
//# sourceMappingURL=recordEvent.d.ts.map