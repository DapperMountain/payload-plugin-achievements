import { getAchievementOptions } from '../../options-store.js';
import { collectionOf } from '../../collections/helpers.js';
import { relationId } from './relationId.js';
const emptyFlags = {
    requiresActor: false,
    requiresMetric: false,
    requiresSubject: false,
    snapshotActorTiers: false,
    subjectRelationTo: [],
};
function readSubjectRelationTo(value) {
    if (!Array.isArray(value))
        return [];
    const out = [];
    for (const entry of value) {
        if (typeof entry === 'string' && entry.trim())
            out.push(entry.trim());
    }
    return out;
}
/** Read flags from a loaded event-type document (or populated relationship). */
export function readEventTypeFlags(doc) {
    if (!doc || typeof doc !== 'object')
        return null;
    const row = doc;
    const hasFlagKeys = 'requiresActor' in row ||
        'requiresMetric' in row ||
        'requiresSubject' in row ||
        'snapshotActorTiers' in row ||
        'subjectRelationTo' in row ||
        typeof row.slug === 'string';
    if (!hasFlagKeys)
        return null;
    return {
        requiresActor: Boolean(row.requiresActor),
        requiresMetric: Boolean(row.requiresMetric) || row.slug === 'metric.delta',
        requiresSubject: Boolean(row.requiresSubject),
        snapshotActorTiers: Boolean(row.snapshotActorTiers),
        subjectRelationTo: readSubjectRelationTo(row.subjectRelationTo),
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
        if ('requiresActor' in row ||
            'requiresMetric' in row ||
            'requiresSubject' in row ||
            'snapshotActorTiers' in row ||
            'subjectRelationTo' in row ||
            'slug' in row) {
            return embedded;
        }
    }
    const typeId = relationId(args.typeIdOrDoc);
    if (!typeId)
        return { ...emptyFlags };
    const found = (await args.payload.findByID({
        collection: collectionOf('eventTypes'),
        id: typeId,
        depth: 0,
        overrideAccess: true,
        req: args.req,
        select: {
            requiresActor: true,
            requiresMetric: true,
            requiresSubject: true,
            snapshotActorTiers: true,
            subjectRelationTo: true,
            slug: true,
        },
    }));
    return flagsFromDoc(found) ?? { ...emptyFlags };
}
export async function eventTypeRequiresActor(args) {
    return (await getEventTypeFlags(args)).requiresActor;
}
export async function eventTypeRequiresMetric(args) {
    return (await getEventTypeFlags(args)).requiresMetric;
}
export async function eventTypeRequiresSubject(args) {
    return (await getEventTypeFlags(args)).requiresSubject;
}
/**
 * Allowed `subject.relationTo` values for this event type.
 * Empty event-type list → full plugin allowlist. Feature off → [].
 */
export async function eventTypeSubjectRelationTo(args) {
    const allowlist = getAchievementOptions().subjectCollections;
    if (allowlist.length === 0)
        return [];
    const flags = await getEventTypeFlags(args);
    if (!flags.requiresSubject)
        return [];
    if (flags.subjectRelationTo.length === 0)
        return [...allowlist];
    return flags.subjectRelationTo.filter((slug) => allowlist.includes(slug));
}
