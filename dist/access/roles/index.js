import { collectionOf } from '../../collections/helpers';
import { getAchievementOptions } from '../../options-store';
import { relationId } from '../../services/achievement/relationId';
import { getUserId } from '../helpers/index';
/** Authenticated user may read/write rows tied to themselves. */
export const isSelfUser = (userRelationField = 'user') => ({ req, data }) => {
    const userId = getUserId(req);
    if (!userId)
        return false;
    if (data && typeof data === 'object' && userRelationField in data) {
        const related = data[userRelationField];
        const relatedId = typeof related === 'object' && related && 'id' in related
            ? String(related.id)
            : String(related);
        return relatedId === userId;
    }
    return {
        [userRelationField]: { equals: userId },
    };
};
async function scopeIdForAccess(args, collectionKey) {
    const fromData = relationId(args.data?.scope);
    if (fromData)
        return fromData;
    if (!args.id || !collectionKey || !args.req?.payload)
        return null;
    try {
        const doc = (await args.req.payload.findByID({
            collection: collectionOf(collectionKey),
            id: String(args.id),
            depth: 0,
            overrideAccess: true,
            req: args.req,
            select: { scope: true },
        }));
        return relationId(doc?.scope);
    }
    catch {
        return null;
    }
}
/**
 * Host `canReview` policy. When unset, privileged writes are denied (safe default).
 * Passes document scope when available (from `data.scope` or loaded by id).
 */
export const isReviewer = (collectionKey) => async (args) => {
    if (!args.req.user)
        return false;
    const { canReview } = getAchievementOptions();
    if (!canReview)
        return false;
    const scopeId = await scopeIdForAccess(args, collectionKey);
    return Boolean(await canReview(args.req.user, scopeId));
};
export const isAuthenticated = ({ req }) => Boolean(req.user);
