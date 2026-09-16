import { isGrantAuditEventSlug } from '../../catalog.js';
import { collectionOf } from '../../collections/helpers.js';
import { BUILTIN_GRANT_ACTION, getHostAction } from '../../extensions/actions.js';
import { CTX_SKIP_GRANT_SIDE_EFFECTS } from './contextFlags.js';
import { createGrantRow } from './grantSideEffects.js';
import { relationId } from './relationId.js';
export function reactionMatchWhere(args) {
    const clauses = [{ enabled: { equals: true } }, { trigger: { equals: args.trigger } }];
    if (args.trigger === 'event') {
        if (!args.eventTypeId)
            return null;
        clauses.push({ eventType: { equals: args.eventTypeId } });
    }
    else {
        if (!args.achievementId)
            return null;
        clauses.push({ achievement: { equals: args.achievementId } });
    }
    if (args.scopeId) {
        clauses.push({
            or: [{ scope: { equals: args.scopeId } }, { scope: { exists: false } }, { scope: { equals: null } }],
        });
    }
    else {
        clauses.push({ or: [{ scope: { exists: false } }, { scope: { equals: null } }] });
    }
    return { and: clauses };
}
export async function runReactions(args) {
    if (!args.userId || args.req.context?.[CTX_SKIP_GRANT_SIDE_EFFECTS])
        return 0;
    if (args.trigger === 'event' && isGrantAuditEventSlug(args.eventTypeSlug))
        return 0;
    const where = reactionMatchWhere({
        trigger: args.trigger,
        scopeId: args.scopeId,
        eventTypeId: args.eventTypeId,
        achievementId: args.achievementId,
    });
    if (!where)
        return 0;
    const found = await args.req.payload.find({
        collection: collectionOf('reactions'),
        depth: 0,
        limit: 200,
        pagination: false,
        overrideAccess: true,
        req: args.req,
        where,
    });
    let ran = 0;
    for (const doc of found.docs) {
        const reaction = doc;
        const action = typeof reaction.action === 'string' ? reaction.action : '';
        if (!action)
            continue;
        if (action === BUILTIN_GRANT_ACTION) {
            const targetId = relationId(reaction.targetAchievement);
            if (!targetId)
                continue;
            await createGrantRow({
                req: args.req,
                userId: args.userId,
                achievementId: targetId,
                scopeId: args.scopeId,
            });
            ran += 1;
            continue;
        }
        const host = getHostAction(action);
        if (!host)
            continue;
        await host.run({
            payload: args.req.payload,
            req: args.req,
            userId: args.userId,
            scopeId: args.scopeId,
            trigger: args.trigger,
            reaction,
            log: args.log ?? null,
            achievementId: args.achievementId ?? null,
        });
        ran += 1;
    }
    return ran;
}
