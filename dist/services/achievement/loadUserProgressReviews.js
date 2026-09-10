import { collectionOf } from '../../collections/helpers.js';
import { relationId } from './relationId.js';
const PENDING_ACHIEVEMENT_REQUESTS_LIMIT = 200;
const TIER_REQUESTS_LIMIT = 50;
function relationSlug(value) {
    if (value && typeof value === 'object' && 'slug' in value) {
        const slug = value.slug;
        if (typeof slug === 'string' && slug)
            return slug;
    }
    return null;
}
function pendingAchievementWhere(userId, scopeId) {
    const clauses = [{ user: { equals: userId } }, { status: { equals: 'pending' } }];
    if (scopeId)
        clauses.push({ scope: { equals: scopeId } });
    return { and: clauses };
}
function openOrRejectedTierRequestWhere(userId, scopeId) {
    const clauses = [
        { user: { equals: userId } },
        { status: { in: ['pending', 'rejected'] } },
    ];
    if (scopeId)
        clauses.push({ scope: { equals: scopeId } });
    return { and: clauses };
}
/**
 * Review-queue snapshot for member UI (pending achievement keys + open/rejected tier requests).
 * Does not decide ready/rejected presentation — hosts apply ladder context themselves.
 */
export async function loadUserProgressReviews(args) {
    const scopeId = args.scopeId ?? null;
    const [pendingAchievementRequests, tierRequests] = await Promise.all([
        args.payload.find({
            collection: collectionOf('achievementRequests'),
            depth: 1,
            limit: PENDING_ACHIEVEMENT_REQUESTS_LIMIT,
            pagination: false,
            overrideAccess: true,
            req: args.req,
            where: pendingAchievementWhere(args.userId, scopeId),
        }),
        scopeId
            ? args.payload.find({
                collection: collectionOf('tierRequests'),
                depth: 0,
                limit: TIER_REQUESTS_LIMIT,
                pagination: false,
                overrideAccess: true,
                req: args.req,
                where: openOrRejectedTierRequestWhere(args.userId, scopeId),
            })
            : Promise.resolve({ docs: [] }),
    ]);
    const pendingAchievementKeys = new Set();
    for (const doc of pendingAchievementRequests.docs) {
        const id = relationId(doc.achievement);
        const slug = relationSlug(doc.achievement);
        if (id)
            pendingAchievementKeys.add(id);
        if (slug)
            pendingAchievementKeys.add(slug);
    }
    const reviews = [];
    for (const doc of tierRequests.docs) {
        const status = doc.status === 'rejected' ? 'rejected' : doc.status === 'pending' ? 'pending' : null;
        if (!status)
            continue;
        const id = typeof doc.id === 'string' && doc.id ? doc.id : relationId(doc.id);
        if (!id)
            continue;
        reviews.push({ id, status, tierId: relationId(doc.tier) });
    }
    return {
        pendingAchievementKeys: [...pendingAchievementKeys],
        tierRequests: reviews,
    };
}
