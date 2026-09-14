import { APIError } from 'payload';
import { getAchievementOptions } from '../../../options-store.js';
import { collectionOf } from '../../../collections/helpers.js';
import { eventTypeSubjectRelationTo, getEventTypeFlags, } from '../../../services/achievement/eventTypeRequiresActor.js';
import { readLogSubject } from '../../../services/achievement/logSubject.js';
import { relationId } from '../../../services/achievement/relationId.js';
export const ensureTypeRequirements = async ({ data, req }) => {
    if (!data)
        return data;
    const typeId = relationId(data.type);
    if (!typeId)
        return data;
    const flags = await getEventTypeFlags({
        payload: req.payload,
        req,
        typeIdOrDoc: typeId,
    });
    if (flags.requiresActor && !relationId(data.actor)) {
        throw new APIError('This log type needs an actor (who caused it).', 400);
    }
    if (flags.requiresMetric) {
        const metricId = relationId(data.metric);
        if (!metricId) {
            throw new APIError('This log type needs a metric.', 400);
        }
        const change = data.change;
        if (typeof change !== 'number' || Number.isNaN(change)) {
            throw new APIError('This log type needs a change amount.', 400);
        }
        const metric = (await req.payload.findByID({
            collection: collectionOf('metrics'),
            id: metricId,
            depth: 0,
            overrideAccess: true,
            req,
            select: { kind: true },
        }));
        if (metric && (metric.kind ?? 'stored') === 'computed') {
            throw new APIError('Computed metrics cannot be changed with a metric delta. Use a stored metric such as Points.', 400);
        }
    }
    if (flags.requiresSubject && getAchievementOptions().subjectCollections.length > 0) {
        const subject = readLogSubject(data.subject);
        if (!subject) {
            throw new APIError('This log type needs a subject (the host document it is about).', 400);
        }
        const allowed = await eventTypeSubjectRelationTo({
            payload: req.payload,
            req,
            typeIdOrDoc: typeId,
        });
        if (allowed.length > 0 && !allowed.includes(subject.relationTo)) {
            throw new APIError(`This log type only allows subjects from: ${allowed.join(', ')}.`, 400);
        }
    }
    return data;
};
