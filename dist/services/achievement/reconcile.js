import { collectionOf } from '../../collections/helpers';
import { syncCompositeProgression, } from './grantSideEffects';
import { recordLog, syncTierChangedLog } from './recordEvent';
import { relationId } from './relationId';
import { resolveCatalogId } from './resolveCatalog';
import { syncTierProgression } from './tierProgression';
import { userScopeWhere } from './where';
async function backfillGrantedLogs(args) {
    const typeId = await resolveCatalogId({
        payload: args.req.payload,
        req: args.req,
        key: 'eventTypes',
        slugOrId: 'achievement.granted',
    });
    const grants = await args.req.payload.find({
        collection: collectionOf('grants'),
        depth: 0,
        limit: 500,
        pagination: false,
        overrideAccess: true,
        req: args.req,
        where: userScopeWhere(args.userId, args.scopeId),
    });
    const logs = await args.req.payload.find({
        collection: collectionOf('logs'),
        depth: 0,
        limit: 500,
        pagination: false,
        overrideAccess: true,
        req: args.req,
        where: {
            and: [userScopeWhere(args.userId, args.scopeId), { type: { equals: typeId } }],
        },
    });
    const logged = new Set(logs.docs
        .map((log) => relationId(log.data?.achievement))
        .filter((id) => Boolean(id)));
    let written = 0;
    for (const grant of grants.docs) {
        const achievementId = relationId(grant.achievement);
        if (!achievementId || logged.has(achievementId))
            continue;
        let slug;
        try {
            const def = (await args.req.payload.findByID({
                collection: collectionOf('achievements'),
                id: achievementId,
                depth: 0,
                overrideAccess: true,
                req: args.req,
                select: { slug: true },
            }));
            slug = def?.slug;
        }
        catch {
            // ignore
        }
        const completedAt = grant.completedAt;
        await recordLog({
            payload: args.req.payload,
            req: args.req,
            userId: args.userId,
            scopeId: args.scopeId,
            type: 'achievement.granted',
            data: {
                achievement: achievementId,
                ...(slug ? { achievementSlug: slug } : {}),
                backfilled: true,
                ...(completedAt ? { completedAt } : {}),
            },
        });
        logged.add(achievementId);
        written += 1;
    }
    return written;
}
/** Repair progression for one user (+ optional scope) from current grants + catalog. */
export async function reconcileUserProgression(args) {
    const scopeId = args.scopeId ?? null;
    const req = args.req ??
        {
            payload: args.payload,
            context: {},
        };
    if (!req.context)
        req.context = {};
    const grantedLogsBackfilled = await backfillGrantedLogs({ req, userId: args.userId, scopeId });
    const composites = await syncCompositeProgression({
        req,
        userId: args.userId,
        scopeId,
    });
    const tiers = await syncTierProgression({
        req,
        userId: args.userId,
        scopeId,
    });
    const tierLog = await syncTierChangedLog({
        payload: args.payload,
        req,
        userId: args.userId,
        scopeId,
    });
    return {
        grantedLogsBackfilled,
        compositesGranted: composites.granted,
        achievementRequestsEnsured: composites.requested,
        tierRequestsEnsured: tiers.requested,
        tierLogsWritten: tierLog ? 1 : 0,
    };
}
function scopeKey(scope) {
    const id = relationId(scope);
    return id ?? '';
}
/** Scan grants and reconcile each distinct (user, scope) pair. */
export async function reconcileProgression(args) {
    const req = args.req ??
        {
            payload: args.payload,
            context: {},
        };
    if (!req.context)
        req.context = {};
    const where = args.scopeId
        ? { scope: { equals: args.scopeId } }
        : undefined;
    const grants = await args.payload.find({
        collection: collectionOf('grants'),
        depth: 0,
        limit: args.limit ?? 5000,
        pagination: false,
        overrideAccess: true,
        req,
        ...(where ? { where } : {}),
    });
    const pairs = new Map();
    for (const grant of grants.docs) {
        const userId = relationId(grant.user);
        if (!userId)
            continue;
        const scopeId = relationId(grant.scope);
        const key = `${userId}::${scopeKey(scopeId)}`;
        if (!pairs.has(key))
            pairs.set(key, { userId, scopeId });
    }
    const totals = {
        usersScanned: 0,
        grantedLogsBackfilled: 0,
        compositesGranted: 0,
        achievementRequestsEnsured: 0,
        tierRequestsEnsured: 0,
        tierLogsWritten: 0,
    };
    for (const pair of pairs.values()) {
        const result = await reconcileUserProgression({
            payload: args.payload,
            req,
            userId: pair.userId,
            scopeId: pair.scopeId,
        });
        totals.usersScanned += 1;
        totals.grantedLogsBackfilled += result.grantedLogsBackfilled;
        totals.compositesGranted += result.compositesGranted;
        totals.achievementRequestsEnsured += result.achievementRequestsEnsured;
        totals.tierRequestsEnsured += result.tierRequestsEnsured;
        totals.tierLogsWritten += result.tierLogsWritten;
    }
    return totals;
}
