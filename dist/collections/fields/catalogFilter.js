import { eventTypeRequiresMetric } from '../../services/achievement/eventTypeRequiresActor.js';
import { relationId } from '../../services/achievement/relationId.js';
/** Relationship picker: same scope as the parent doc, or unscoped (global) catalog rows. */
export function catalogFilterOptions({ data }) {
    const scopeId = relationId(data?.scope);
    if (!scopeId)
        return true;
    return {
        or: [{ scope: { equals: scopeId } }, { scope: { exists: false } }, { scope: { equals: null } }],
    };
}
/**
 * Metric picker on achievement logs: same scope rules as other catalog fields,
 * but when the log type needs a metric (e.g. `metric.delta`), only **stored**
 * metrics are offered — computed metrics (like Days) cannot receive deltas.
 */
export const metricLogFilterOptions = async ({ data, req }) => {
    const scopeFilter = catalogFilterOptions({ data: data });
    const typeId = relationId(data?.type);
    let storedOnly = false;
    if (typeId && req?.payload) {
        storedOnly = await eventTypeRequiresMetric({
            payload: req.payload,
            req,
            typeIdOrDoc: typeId,
        });
    }
    if (!storedOnly)
        return scopeFilter;
    const storedWhere = {
        or: [{ kind: { equals: 'stored' } }, { kind: { exists: false } }, { kind: { equals: null } }],
    };
    if (scopeFilter === true)
        return storedWhere;
    return { and: [scopeFilter, storedWhere] };
};
