import { collectionOf } from '../../collections/helpers.js';
import { relationId } from './relationId.js';
import { userScopeIncludingUnscopedWhere, userScopeWhere } from './where.js';
function clamp01(value) {
    if (!Number.isFinite(value))
        return 0;
    return Math.max(0, Math.min(1, value));
}
async function resolveMetricId(args) {
    const metricId = relationId(args.rule.metric);
    if (metricId)
        return metricId;
    const metricSlug = typeof args.rule.metricSlug === 'string' ? args.rule.metricSlug : '';
    if (!metricSlug)
        return null;
    const found = await args.payload.find({
        collection: collectionOf('metrics'),
        depth: 0,
        limit: 1,
        overrideAccess: true,
        where: { slug: { equals: metricSlug } },
    });
    return relationId(found.docs[0]);
}
async function metricValue(args) {
    const logs = await args.payload.find({
        collection: collectionOf('logs'),
        depth: 0,
        limit: 1000,
        pagination: false,
        overrideAccess: true,
        where: {
            and: [userScopeWhere(args.userId, args.scopeId), { metric: { equals: args.metricId } }],
        },
    });
    return logs.docs.reduce((sum, doc) => {
        const change = doc.change;
        return sum + (typeof change === 'number' && Number.isFinite(change) ? change : 0);
    }, 0);
}
async function resolveEventTypeId(args) {
    let eventTypeId = relationId(args.rule.eventType);
    if (eventTypeId) {
        // Seeded rules may store a slug string in `eventType` before resolve; only treat
        // opaque ids as final when a catalog row exists.
        const byId = await args.payload.find({
            collection: collectionOf('eventTypes'),
            depth: 0,
            limit: 1,
            overrideAccess: true,
            where: { id: { equals: eventTypeId } },
        });
        if (relationId(byId.docs[0]))
            return eventTypeId;
    }
    const slugCandidate = (typeof args.rule.eventTypeSlug === 'string' && args.rule.eventTypeSlug) ||
        (typeof args.rule.eventType === 'string' && args.rule.eventType) ||
        '';
    if (!slugCandidate)
        return null;
    const found = await args.payload.find({
        collection: collectionOf('eventTypes'),
        depth: 0,
        limit: 1,
        overrideAccess: true,
        where: { slug: { equals: slugCandidate } },
    });
    return relationId(found.docs[0]);
}
async function resolveAchievementRef(args) {
    let requiredId = relationId(args.rule.achievement);
    let requiredSlug = typeof args.rule.achievementSlug === 'string' ? args.rule.achievementSlug : '';
    let eligibilityRules;
    let completionRules;
    if (!requiredId && requiredSlug) {
        const found = await args.payload.find({
            collection: collectionOf('achievements'),
            depth: 0,
            limit: 1,
            overrideAccess: true,
            where: args.scopeId
                ? {
                    and: [{ slug: { equals: requiredSlug } }, { scope: { equals: args.scopeId } }],
                }
                : { slug: { equals: requiredSlug } },
        });
        const doc = found.docs[0];
        requiredId = relationId(doc);
        requiredSlug = String(doc?.slug ?? requiredSlug);
        eligibilityRules = doc?.eligibilityRules;
        completionRules = doc?.completionRules;
    }
    if (requiredId && (eligibilityRules === undefined || completionRules === undefined || !requiredSlug)) {
        const doc = (await args.payload.findByID({
            collection: collectionOf('achievements'),
            id: requiredId,
            depth: 0,
            overrideAccess: true,
        }));
        requiredSlug = requiredSlug || String(doc?.slug ?? '');
        eligibilityRules = eligibilityRules ?? doc?.eligibilityRules;
        completionRules = completionRules ?? doc?.completionRules;
    }
    return { id: requiredId, slug: requiredSlug, eligibilityRules, completionRules };
}
async function isAchievementGranted(args) {
    if (!args.requiredId && !args.requiredSlug)
        return false;
    const grantClauses = [{ user: { equals: args.userId } }];
    if (args.scopeId)
        grantClauses.push({ scope: { equals: args.scopeId } });
    if (args.requiredId)
        grantClauses.push({ achievement: { equals: args.requiredId } });
    const grants = await args.payload.find({
        collection: collectionOf('grants'),
        depth: args.requiredSlug && !args.requiredId ? 1 : 0,
        limit: args.requiredId ? 1 : 50,
        overrideAccess: true,
        where: { and: grantClauses },
    });
    if (args.requiredId)
        return grants.docs.length > 0;
    return grants.docs.some((doc) => {
        const achievement = doc.achievement;
        if (achievement && typeof achievement === 'object') {
            return achievement.slug === args.requiredSlug;
        }
        return false;
    });
}
export const builtInRuleTypes = [
    {
        type: 'tier-at-least',
        progressRole: 'gate',
        async evaluate({ payload, req, rule, userId, scopeId, ladderRank }) {
            const tierId = relationId(rule.tier);
            let requiredRank;
            if (tierId) {
                const tier = (await payload.findByID({
                    collection: collectionOf('tiers'),
                    id: tierId,
                    depth: 0,
                    overrideAccess: true,
                }));
                requiredRank = tier?.rank;
            }
            else {
                const tierSlug = String(rule.tierSlug ?? '');
                if (!tierSlug)
                    return false;
                const tiers = await payload.find({
                    collection: collectionOf('tiers'),
                    depth: 0,
                    limit: 1,
                    overrideAccess: true,
                    where: scopeId
                        ? { and: [{ slug: { equals: tierSlug } }, { scope: { equals: scopeId } }] }
                        : { slug: { equals: tierSlug } },
                });
                requiredRank = tiers.docs[0]?.rank;
            }
            if (typeof requiredRank !== 'number')
                return false;
            let currentRank = ladderRank;
            if (currentRank === undefined) {
                const { resolveCurrentTier } = await import('./resolveCurrentTier.js');
                const current = await resolveCurrentTier({
                    payload,
                    req,
                    userId,
                    scopeId,
                });
                currentRank = current?.rank ?? null;
            }
            return typeof currentRank === 'number' && currentRank >= requiredRank;
        },
    },
    {
        type: 'achievement-complete',
        async evaluate({ payload, rule, userId, scopeId }) {
            const ref = await resolveAchievementRef({ payload, rule, scopeId });
            return isAchievementGranted({
                payload,
                userId,
                scopeId,
                requiredId: ref.id,
                requiredSlug: ref.slug,
            });
        },
        async progress(args) {
            const { payload, req, rule, userId, scopeId, ladderRank, progressVisited } = args;
            const ref = await resolveAchievementRef({ payload, rule, scopeId });
            if (!ref.id && !ref.slug)
                return 0;
            const granted = await isAchievementGranted({
                payload,
                userId,
                scopeId,
                requiredId: ref.id,
                requiredSlug: ref.slug,
            });
            if (granted)
                return 1;
            const visitKey = ref.id || ref.slug;
            const visited = progressVisited ?? new Set();
            if (visited.has(visitKey))
                return 0;
            visited.add(visitKey);
            const { evaluateRuleProgress, ruleGroupHasProgressRequirements } = await import('./evaluateRules.js');
            const composition = ruleGroupHasProgressRequirements(ref.completionRules)
                ? ref.completionRules
                : ref.eligibilityRules;
            if (!ruleGroupHasProgressRequirements(composition))
                return 0;
            return evaluateRuleProgress({
                payload,
                req,
                rules: composition,
                userId,
                scopeId,
                ladderRank,
                progressVisited: visited,
            });
        },
    },
    {
        type: 'metric-minimum',
        async evaluate({ payload, rule, userId, scopeId }) {
            const resolvedId = await resolveMetricId({ payload, rule });
            if (!resolvedId)
                return false;
            const minimum = Number(rule.minimum ?? 0);
            const value = await metricValue({ payload, userId, scopeId, metricId: resolvedId });
            return value >= minimum;
        },
        async progress({ payload, rule, userId, scopeId }) {
            const resolvedId = await resolveMetricId({ payload, rule });
            if (!resolvedId)
                return 0;
            const minimum = Number(rule.minimum ?? 0);
            if (!(minimum > 0))
                return 1;
            const value = await metricValue({ payload, userId, scopeId, metricId: resolvedId });
            return clamp01(value / minimum);
        },
    },
    {
        type: 'event-count',
        async evaluate({ payload, rule, userId, scopeId }) {
            const eventTypeId = await resolveEventTypeId({ payload, rule });
            if (!eventTypeId)
                return false;
            const needed = Number(rule.count ?? 1);
            const result = await payload.count({
                collection: collectionOf('logs'),
                overrideAccess: true,
                where: {
                    and: [userScopeIncludingUnscopedWhere(userId, scopeId), { type: { equals: eventTypeId } }],
                },
            });
            return result.totalDocs >= needed;
        },
        async progress({ payload, rule, userId, scopeId }) {
            const eventTypeId = await resolveEventTypeId({ payload, rule });
            if (!eventTypeId)
                return 0;
            const needed = Number(rule.count ?? 1);
            if (!(needed > 0))
                return 1;
            const result = await payload.count({
                collection: collectionOf('logs'),
                overrideAccess: true,
                where: {
                    and: [userScopeIncludingUnscopedWhere(userId, scopeId), { type: { equals: eventTypeId } }],
                },
            });
            return clamp01(result.totalDocs / needed);
        },
    },
];
