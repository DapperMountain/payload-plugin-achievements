import { collectionOf } from '../../collections/helpers';
import { createGrantRow } from './grantSideEffects';
/**
 * Create an achievement request (or auto-approved grant) via the collection.
 * Hooks bind the requesting user, check eligibility, and grant when approved.
 */
export async function submitAchievementRequest(args) {
    return args.req.payload.create({
        collection: collectionOf('achievementRequests'),
        data: {
            user: args.userId,
            scope: args.scopeId ?? undefined,
            achievement: args.achievementId,
            note: args.note,
            status: 'pending',
        },
        overrideAccess: false,
        req: args.req,
        user: args.req.user ?? undefined,
    });
}
/**
 * Create a grant row. Side effects (logs, composites, tiers) run in Grants hooks.
 */
export async function grantAchievement(args) {
    return createGrantRow({
        req: args.req,
        userId: args.userId,
        achievementId: args.achievementId,
        scopeId: args.scopeId,
        note: args.note,
    });
}
