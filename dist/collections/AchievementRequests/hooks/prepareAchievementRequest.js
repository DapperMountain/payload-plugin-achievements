import { APIError } from 'payload';
import { collectionOf } from '../../../collections/helpers.js';
import { CTX_SYSTEM_REQUEST } from '../../../services/achievement/contextFlags.js';
import { evaluateRules, ruleGroupHasProgressRequirements } from '../../../services/achievement/evaluateRules.js';
import { grantAchievement } from '../../../services/achievement/submitAchievementRequest.js';
import { relationId } from '../../../services/achievement/relationId.js';
function scopeIdOf(data) {
    const scope = data?.scope;
    if (!scope)
        return null;
    return relationId(scope);
}
async function resolveAchievement(args) {
    const achievementId = relationId(args.data.achievement);
    if (!achievementId) {
        throw new APIError('achievement required', 400);
    }
    const doc = (await args.req.payload.findByID({
        collection: collectionOf('achievements'),
        id: achievementId,
        depth: 0,
        overrideAccess: true,
        req: args.req,
    }));
    if (!doc)
        throw new APIError(`Unknown achievement: ${achievementId}`, 400);
    return doc;
}
/**
 * Create: bind the requesting user, enforce eligibility,
 * auto-approve when the definition does not require review.
 * Update: status transitions handled in afterChange.
 */
export const prepareAchievementRequest = async ({ data, operation, req, originalDoc, }) => {
    if (!data)
        return data;
    if (operation === 'create') {
        const system = Boolean(req.context?.[CTX_SYSTEM_REQUEST]);
        if (!system) {
            const userId = req.user?.id;
            if (typeof userId !== 'string')
                throw new APIError('Unauthorized', 401);
            data.user = userId;
        }
        else {
            const bound = relationId(data.user);
            if (!bound)
                throw new APIError('user required', 400);
            data.user = bound;
        }
        const userId = relationId(data.user);
        if (!userId)
            throw new APIError('user required', 400);
        const scopeId = scopeIdOf(data);
        const achievement = await resolveAchievement({
            req,
            data: data,
        });
        data.achievement = achievement.id;
        if (!system && ruleGroupHasProgressRequirements(achievement.completionRules)) {
            throw new APIError('This achievement is granted automatically when its completion rules pass.', 400);
        }
        if (!system) {
            const eligible = await evaluateRules({
                payload: req.payload,
                req,
                rules: achievement.eligibilityRules,
                userId,
                scopeId,
            });
            if (!eligible) {
                throw new APIError('Eligibility rules not met for this achievement.', 400);
            }
        }
        if (system) {
            data.status = data.status ?? 'pending';
        }
        else {
            data.status = achievement.requiresReview === false ? 'approved' : 'pending';
        }
        return data;
    }
    if (operation === 'update') {
        // Cannot reassign user or achievement on an existing request.
        if (originalDoc) {
            data.user = originalDoc.user;
            data.achievement = originalDoc.achievement;
        }
    }
    return data;
};
/**
 * When a request becomes approved, grant the achievement (create or pending→approved).
 */
export const grantOnApprovedRequest = async ({ doc, operation, previousDoc, req, }) => {
    if (req.context?.achievementGranting)
        return doc;
    const status = doc.status;
    if (status !== 'approved')
        return doc;
    const previousStatus = operation === 'update' ? previousDoc?.status : undefined;
    if (previousStatus === 'approved')
        return doc;
    const achievementId = relationId(doc.achievement);
    const userId = relationId(doc.user);
    if (!achievementId || !userId) {
        throw new APIError('Approved request missing achievement or user', 400);
    }
    const scopeId = scopeIdOf(doc);
    const note = doc.note;
    req.context.achievementGranting = true;
    try {
        await grantAchievement({
            req,
            userId,
            achievementId,
            scopeId,
            note,
        });
    }
    finally {
        req.context.achievementGranting = false;
    }
    return doc;
};
