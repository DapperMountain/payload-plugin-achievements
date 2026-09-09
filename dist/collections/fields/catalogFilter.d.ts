import type { FilterOptions, Where } from 'payload';
/** Relationship picker: same scope as the parent doc, or unscoped (global) catalog rows. */
export declare function catalogFilterOptions({ data }: {
    data?: {
        scope?: unknown;
    };
}): Where | true;
/**
 * Metric picker on achievement logs: same scope rules as other catalog fields,
 * but when the log type needs a metric (e.g. `metric.delta`), only **stored**
 * metrics are offered — computed metrics (like Days) cannot receive deltas.
 */
export declare const metricLogFilterOptions: FilterOptions;
//# sourceMappingURL=catalogFilter.d.ts.map