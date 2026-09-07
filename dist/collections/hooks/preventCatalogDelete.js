import { APIError } from 'payload';
import { collectionOf } from '../helpers';
import { relationId } from '../../services/achievement/relationId';
import { eachRuleLeaf } from './eachRuleLeaf';
async function countMatchingLeaves(args) {
    let count = 0;
    const visit = (rule) => {
        if (args.match(rule))
            count += 1;
    };
    const [tiers, achievements] = await Promise.all([
        args.req.payload.find({
            collection: collectionOf('tiers'),
            depth: 0,
            limit: 1000,
            pagination: false,
            overrideAccess: true,
            req: args.req,
        }),
        args.req.payload.find({
            collection: collectionOf('achievements'),
            depth: 0,
            limit: 1000,
            pagination: false,
            overrideAccess: true,
            req: args.req,
        }),
    ]);
    for (const doc of tiers.docs) {
        eachRuleLeaf(doc.unlockRules, visit);
    }
    for (const doc of achievements.docs) {
        eachRuleLeaf(doc.eligibilityRules, visit);
        eachRuleLeaf(doc.completionRules, visit);
    }
    return count;
}
export function preventCatalogDelete(args) {
    const { kind } = args;
    return async ({ id, req }) => {
        const collectionKey = kind === 'eventType' ? 'eventTypes' : 'metrics';
        const doc = (await req.payload.findByID({
            collection: collectionOf(collectionKey),
            id,
            depth: 0,
            overrideAccess: true,
            req,
        }));
        if (doc?.system) {
            throw new APIError('System catalog entries cannot be deleted.', 400);
        }
        const parts = [];
        if (kind === 'eventType') {
            const logs = await req.payload.count({
                collection: collectionOf('logs'),
                overrideAccess: true,
                req,
                where: { type: { equals: id } },
            });
            if (logs.totalDocs > 0)
                parts.push(`${logs.totalDocs} log row(s)`);
            const rules = await countMatchingLeaves({
                req,
                match: (rule) => rule.type === 'event-count' && relationId(rule.eventType) === id,
            });
            if (rules > 0)
                parts.push(`${rules} rule(s)`);
        }
        else {
            const logs = await req.payload.count({
                collection: collectionOf('logs'),
                overrideAccess: true,
                req,
                where: { metric: { equals: id } },
            });
            if (logs.totalDocs > 0)
                parts.push(`${logs.totalDocs} log row(s)`);
            const rules = await countMatchingLeaves({
                req,
                match: (rule) => rule.type === 'metric-minimum' && relationId(rule.metric) === id,
            });
            if (rules > 0)
                parts.push(`${rules} rule(s)`);
        }
        if (parts.length > 0) {
            throw new APIError(`Cannot delete "${doc?.name ?? id}": in use by ${parts.join(', ')}.`, 400);
        }
    };
}
