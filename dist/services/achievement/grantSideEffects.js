import { collectionOf } from '../../collections/helpers.js';
import { CTX_CASCADING_REVOKE, CTX_SYSTEM_REQUEST } from './contextFlags.js';
import { evaluateRules, ruleGroupHasProgressRequirements } from './evaluateRules.js';
import { transitionLogData } from './logData.js';
import { recordLog, syncTierChangedLog } from './recordEvent.js';
import { relationId } from './relationId.js';
import { syncTierProgression } from './tierProgression.js';
import { userScopeWhere } from './where.js';
export { CTX_CASCADING_REVOKE, CTX_SKIP_GRANT_SIDE_EFFECTS, CTX_SYSTEM_REQUEST } from './contextFlags.js';
/** Create a grant row only — side effects run in Grants afterChange. */
export async function createGrantRow(args) {
    const scopeId = args.scopeId ?? null;
    const clauses = [
        { user: { equals: args.userId } },
        { achievement: { equals: args.achievementId } },
    ];
    if (scopeId)
        clauses.push({ scope: { equals: scopeId } });
    else
        clauses.push({ scope: { exists: false } });
    const existing = await args.req.payload.find({
        collection: collectionOf('grants'),
        depth: 0,
        limit: 1,
        overrideAccess: true,
        req: args.req,
        where: { and: clauses },
    });
    if (existing.docs[0])
        return existing.docs[0];
    return (await args.req.payload.create({
        collection: collectionOf('grants'),
        data: {
            user: args.userId,
            scope: scopeId ?? undefined,
            achievement: args.achievementId,
            completedAt: args.completedAt ?? new Date().toISOString(),
            ...(args.note ? { note: args.note } : {}),
        },
        overrideAccess: true,
        req: args.req,
    }));
}
/** Ensure a pending achievement request exists (system / reconcile path). */
export async function ensureAchievementRequest(args) {
    const scopeId = args.scopeId ?? null;
    const clauses = [
        { user: { equals: args.userId } },
        { achievement: { equals: args.achievementId } },
        { status: { in: ['pending', 'approved'] } },
    ];
    if (scopeId)
        clauses.push({ scope: { equals: scopeId } });
    else
        clauses.push({ scope: { exists: false } });
    const existing = await args.req.payload.find({
        collection: collectionOf('achievementRequests'),
        depth: 0,
        limit: 1,
        overrideAccess: true,
        req: args.req,
        where: { and: clauses },
    });
    if (existing.docs[0]) {
        return { doc: existing.docs[0], created: false };
    }
    args.req.context[CTX_SYSTEM_REQUEST] = true;
    try {
        const doc = (await args.req.payload.create({
            collection: collectionOf('achievementRequests'),
            data: {
                user: args.userId,
                scope: scopeId ?? undefined,
                achievement: args.achievementId,
                status: 'pending',
            },
            overrideAccess: true,
            req: args.req,
        }));
        return { doc, created: true };
    }
    finally {
        delete args.req.context[CTX_SYSTEM_REQUEST];
    }
}
/**
 * Auto-grant or open a request for composed achievements whose completion rules pass.
 */
export async function syncCompositeProgression(args) {
    const where = args.scopeId
        ? { or: [{ scope: { equals: args.scopeId } }, { scope: { exists: false } }] }
        : undefined;
    const catalog = await args.req.payload.find({
        collection: collectionOf('achievements'),
        depth: 0,
        limit: 500,
        pagination: false,
        overrideAccess: true,
        req: args.req,
        ...(where ? { where } : {}),
    });
    let granted = 0;
    let requested = 0;
    for (const doc of catalog.docs) {
        const def = doc;
        if (!ruleGroupHasProgressRequirements(def.completionRules))
            continue;
        const complete = await evaluateRules({
            payload: args.req.payload,
            req: args.req,
            rules: def.completionRules,
            userId: args.userId,
            scopeId: args.scopeId,
        });
        if (!complete)
            continue;
        if (def.requiresReview !== false) {
            const { created } = await ensureAchievementRequest({
                req: args.req,
                userId: args.userId,
                achievementId: String(def.id),
                scopeId: args.scopeId,
            });
            if (created)
                requested += 1;
            continue;
        }
        const before = await args.req.payload.find({
            collection: collectionOf('grants'),
            depth: 0,
            limit: 1,
            overrideAccess: true,
            req: args.req,
            where: {
                and: [
                    { user: { equals: args.userId } },
                    { achievement: { equals: String(def.id) } },
                    ...(args.scopeId
                        ? [{ scope: { equals: args.scopeId } }]
                        : [{ scope: { exists: false } }]),
                ],
            },
        });
        if (before.docs[0])
            continue;
        await createGrantRow({
            req: args.req,
            userId: args.userId,
            achievementId: String(def.id),
            scopeId: args.scopeId,
        });
        granted += 1;
    }
    return { granted, requested };
}
/** Delete grants for composed achievements that no longer pass completion rules. */
export async function revokeIncompleteComposites(args) {
    const grants = await args.req.payload.find({
        collection: collectionOf('grants'),
        depth: 0,
        limit: 500,
        pagination: false,
        overrideAccess: true,
        req: args.req,
        where: userScopeWhere(args.userId, args.scopeId),
    });
    let revoked = 0;
    for (const grant of grants.docs) {
        const achievementId = relationId(grant.achievement);
        if (!achievementId)
            continue;
        const def = (await args.req.payload.findByID({
            collection: collectionOf('achievements'),
            id: achievementId,
            depth: 0,
            overrideAccess: true,
            req: args.req,
        }));
        if (!def || !ruleGroupHasProgressRequirements(def.completionRules))
            continue;
        const complete = await evaluateRules({
            payload: args.req.payload,
            req: args.req,
            rules: def.completionRules,
            userId: args.userId,
            scopeId: args.scopeId,
        });
        if (complete)
            continue;
        args.req.context[CTX_CASCADING_REVOKE] = true;
        try {
            await args.req.payload.delete({
                collection: collectionOf('grants'),
                id: String(grant.id),
                overrideAccess: true,
                req: args.req,
            });
            revoked += 1;
        }
        finally {
            delete args.req.context[CTX_CASCADING_REVOKE];
        }
    }
    return revoked;
}
export async function runAfterGrantCreated(args) {
    await recordLog({
        payload: args.req.payload,
        req: args.req,
        userId: args.userId,
        scopeId: args.scopeId,
        type: 'achievement.granted',
        data: transitionLogData({
            from: null,
            to: { id: args.achievementId, slug: args.achievementSlug },
        }),
    });
    await syncCompositeProgression({
        req: args.req,
        userId: args.userId,
        scopeId: args.scopeId,
    });
    await syncTierProgression({
        req: args.req,
        userId: args.userId,
        scopeId: args.scopeId,
    });
    await syncTierChangedLog({
        payload: args.req.payload,
        req: args.req,
        userId: args.userId,
        scopeId: args.scopeId,
    });
}
export async function runAfterGrantDeleted(args) {
    await recordLog({
        payload: args.req.payload,
        req: args.req,
        userId: args.userId,
        scopeId: args.scopeId,
        type: 'achievement.revoked',
        data: transitionLogData({
            from: { id: args.achievementId, slug: args.achievementSlug },
            to: null,
        }),
    });
    if (args.cascading)
        return;
    await revokeIncompleteComposites({
        req: args.req,
        userId: args.userId,
        scopeId: args.scopeId,
    });
    await syncCompositeProgression({
        req: args.req,
        userId: args.userId,
        scopeId: args.scopeId,
    });
    await syncTierProgression({
        req: args.req,
        userId: args.userId,
        scopeId: args.scopeId,
    });
    await syncTierChangedLog({
        payload: args.req.payload,
        req: args.req,
        userId: args.userId,
        scopeId: args.scopeId,
    });
}
