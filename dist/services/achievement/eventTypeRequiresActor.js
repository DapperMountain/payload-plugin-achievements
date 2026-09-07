import { collectionOf } from '../../collections/helpers';
import { relationId } from './relationId';
/** Read flags from a loaded event-type document (or populated relationship). */
export function readEventTypeFlags(doc) {
    if (!doc || typeof doc !== 'object')
        return null;
    const row = doc;
    const hasFlagKeys = 'requiresActor' in row || 'requiresMetric' in row || typeof row.slug === 'string';
    if (!hasFlagKeys)
        return null;
    return {
        requiresActor: Boolean(row.requiresActor),
        requiresMetric: Boolean(row.requiresMetric) || row.slug === 'metric.delta',
    };
}
function flagsFromDoc(doc) {
    return readEventTypeFlags(doc);
}
/** Flags from an event-type catalog row (or its id). */
export async function getEventTypeFlags(args) {
    const embedded = flagsFromDoc(args.typeIdOrDoc);
    if (embedded && args.typeIdOrDoc && typeof args.typeIdOrDoc === 'object') {
        const row = args.typeIdOrDoc;
        if ('requiresActor' in row || 'requiresMetric' in row || 'slug' in row) {
            return embedded;
        }
    }
    const typeId = relationId(args.typeIdOrDoc);
    if (!typeId)
        return { requiresActor: false, requiresMetric: false };
    const found = (await args.payload.findByID({
        collection: collectionOf('eventTypes'),
        id: typeId,
        depth: 0,
        overrideAccess: true,
        req: args.req,
        select: { requiresActor: true, requiresMetric: true, slug: true },
    }));
    return flagsFromDoc(found) ?? { requiresActor: false, requiresMetric: false };
}
export async function eventTypeRequiresActor(args) {
    return (await getEventTypeFlags(args)).requiresActor;
}
export async function eventTypeRequiresMetric(args) {
    return (await getEventTypeFlags(args)).requiresMetric;
}
