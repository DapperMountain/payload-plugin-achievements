import { collectionOf } from '../../collections/helpers.js';
import { elapsedUnits } from './duration.js';
import { findMetricBalance } from './metricBalances.js';
import { relationId } from './relationId.js';
import { resolveElapsedAnchor } from './resolveElapsedAnchor.js';
export async function loadMetricDoc(args) {
    const byId = relationId(args.metric);
    if (byId && args.metric === byId) {
        try {
            const doc = (await args.payload.findByID({
                collection: collectionOf('metrics'),
                id: byId,
                depth: 0,
                overrideAccess: true,
                req: args.req,
            }));
            if (doc)
                return { ...doc, id: byId };
        }
        catch {
            // fall through to slug lookup
        }
    }
    const found = await args.payload.find({
        collection: collectionOf('metrics'),
        depth: 0,
        limit: 1,
        overrideAccess: true,
        req: args.req,
        where: {
            or: [{ id: { equals: args.metric } }, { slug: { equals: args.metric } }],
        },
    });
    const doc = found.docs[0];
    const id = relationId(doc);
    if (!doc || !id)
        return null;
    return { ...doc, id };
}
/**
 * Current numeric value for a metric (stored balance or computed elapsed).
 */
export async function resolveMetricValue(args) {
    const doc = typeof args.metric === 'string'
        ? await loadMetricDoc({ payload: args.payload, req: args.req, metric: args.metric })
        : args.metric;
    if (!doc)
        return 0;
    const kind = doc.kind ?? 'stored';
    if (kind === 'computed') {
        if ((doc.compute ?? 'elapsed') !== 'elapsed')
            return 0;
        const anchor = await resolveElapsedAnchor({
            payload: args.payload,
            req: args.req,
            since: doc.since,
            eventType: doc.eventType,
            userId: args.userId,
            scopeId: args.scopeId,
        });
        if (!anchor)
            return 0;
        return elapsedUnits(anchor, doc.unit ?? 'days', args.now ?? new Date()) ?? 0;
    }
    const balance = await findMetricBalance({
        payload: args.payload,
        req: args.req,
        userId: args.userId,
        scopeId: args.scopeId,
        metricId: doc.id,
    });
    return balance?.value ?? 0;
}
