import { collectionOf } from '../../collections/helpers';
import { relationId } from './relationId';
/**
 * When a definition stops requiring review, approve each pending request for that
 * definition so existing grant / tier.changed hooks run for that user + scope only.
 */
export async function releasePendingAchievementReviews(args) {
    const pending = await args.req.payload.find({
        collection: collectionOf('achievementRequests'),
        depth: 0,
        limit: 5000,
        pagination: false,
        overrideAccess: true,
        req: args.req,
        where: {
            and: [
                { achievement: { equals: args.achievementId } },
                { status: { equals: 'pending' } },
            ],
        },
    });
    let requestsApproved = 0;
    for (const doc of pending.docs) {
        const id = relationId(doc.id);
        if (!id)
            continue;
        await args.req.payload.update({
            collection: collectionOf('achievementRequests'),
            id,
            data: { status: 'approved' },
            depth: 0,
            overrideAccess: true,
            req: args.req,
        });
        requestsApproved += 1;
    }
    return { requestsApproved };
}
export async function releasePendingTierReviews(args) {
    const pending = await args.req.payload.find({
        collection: collectionOf('tierRequests'),
        depth: 0,
        limit: 5000,
        pagination: false,
        overrideAccess: true,
        req: args.req,
        where: {
            and: [{ tier: { equals: args.tierId } }, { status: { equals: 'pending' } }],
        },
    });
    let requestsApproved = 0;
    for (const doc of pending.docs) {
        const id = relationId(doc.id);
        if (!id)
            continue;
        await args.req.payload.update({
            collection: collectionOf('tierRequests'),
            id,
            data: { status: 'approved' },
            depth: 0,
            overrideAccess: true,
            req: args.req,
        });
        requestsApproved += 1;
    }
    return { requestsApproved };
}
/** True when `requiresReview` flipped from required → not required. */
export function didDisableRequiresReview(previousDoc, doc) {
    return previousDoc?.requiresReview === true && doc?.requiresReview !== true;
}
