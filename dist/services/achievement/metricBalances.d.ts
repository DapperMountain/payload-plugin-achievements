import type { Payload, PayloadRequest } from 'payload';
export declare function metricBalanceKey(userId: string, scopeId: string | null, metricId: string): string;
export declare function findMetricBalance(args: {
    payload: Payload;
    req?: PayloadRequest;
    userId: string;
    scopeId: string | null;
    metricId: string;
}): Promise<{
    id: string;
    value: number;
} | null>;
export declare function applyMetricBalanceDelta(args: {
    payload: Payload;
    req?: PayloadRequest;
    userId: string;
    scopeId: string | null;
    metricId: string;
    change: number;
}): Promise<{
    id: string;
    value: number;
}>;
/** Sum metric.delta log changes and upsert the balance projection. */
export declare function rebuildMetricBalance(args: {
    payload: Payload;
    req?: PayloadRequest;
    userId: string;
    scopeId?: string | null;
    metricId: string;
}): Promise<{
    id: string;
    value: number;
}>;
/** Rebuild balances for every distinct metric seen in this user’s metric.delta logs. */
export declare function rebuildMetricBalancesForUser(args: {
    payload: Payload;
    req?: PayloadRequest;
    userId: string;
    scopeId?: string | null;
}): Promise<number>;
//# sourceMappingURL=metricBalances.d.ts.map