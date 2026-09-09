import type { Payload, PayloadRequest } from 'payload';
export type MetricLeaderboardRow = {
    user: string;
    value: number;
    rank: number;
};
export type MetricLeaderboardResult = {
    docs: MetricLeaderboardRow[];
    totalDocs: number;
    page: number;
    limit: number;
    totalPages: number;
    metric: {
        id: string;
        slug?: string;
    };
    scopeId: string | null;
};
/**
 * Ranked stored-metric balances for a scope (or unscoped board when `scopeId` is null).
 */
export declare function getMetricLeaderboard(args: {
    payload: Payload;
    req?: PayloadRequest;
    metric: string;
    scopeId?: string | null;
    limit?: number;
    page?: number;
}): Promise<MetricLeaderboardResult>;
//# sourceMappingURL=getMetricLeaderboard.d.ts.map