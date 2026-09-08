import { APIError } from 'payload';
import { collectionOf } from '../../../collections/helpers';
import { CTX_SYSTEM_REQUEST } from '../../../services/achievement/contextFlags';
import { syncTierChangedLog } from '../../../services/achievement/recordEvent';
import { relationId } from '../../../services/achievement/relationId';
function scopeIdOf(data) {
    return relationId(data?.scope);
}
/**
 * System-created requests (reconcile / progression sync) may set user freely.
 * Member creates are not used for tiers in v1 — reviewers/system own the flow.
 */
export const prepareTierRequest = async ({ data, operation, req, originalDoc, }) => {
    if (!data)
        return data;
    if (operation === 'create') {
        if (!req.context?.[CTX_SYSTEM_REQUEST]) {
            const userId = req.user?.id;
            if (typeof userId !== 'string')
                throw new APIError('Unauthorized', 401);
            data.user = userId;
        }
        const tierId = relationId(data.tier);
        if (!tierId)
            throw new APIError('tier required', 400);
        const tier = await req.payload.findByID({
            collection: collectionOf('tiers'),
            id: tierId,
            depth: 0,
            overrideAccess: true,
            req,
        });
        if (!tier)
            throw new APIError(`Unknown tier: ${tierId}`, 400);
        if (tier.requiresReview !== true) {
            throw new APIError('This tier does not require review.', 400);
        }
        data.tier = tierId;
        if (!data.status)
            data.status = 'pending';
        return data;
    }
    if (operation === 'update' && originalDoc) {
        data.user = originalDoc.user;
        data.tier = originalDoc.tier;
    }
    return data;
};
export const afterTierRequestChange = async ({ doc, operation, previousDoc, req, }) => {
    const status = doc.status;
    if (status !== 'approved')
        return doc;
    const previousStatus = operation === 'update' ? previousDoc?.status : undefined;
    if (previousStatus === 'approved')
        return doc;
    const userId = relationId(doc.user);
    if (!userId)
        return doc;
    const scopeId = scopeIdOf(doc);
    await syncTierChangedLog({
        payload: req.payload,
        req: req,
        userId,
        scopeId,
    });
    return doc;
};
