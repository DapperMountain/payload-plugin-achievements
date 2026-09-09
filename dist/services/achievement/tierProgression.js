import { collectionOf } from '../../collections/helpers.js';
import { CTX_SYSTEM_REQUEST } from './contextFlags.js';
import { evaluateRules } from './evaluateRules.js';
import { hasApprovedTierRequest } from './tierApproval.js';
export async function ensureTierRequest(args) {
    const clauses = [
        { user: { equals: args.userId } },
        { tier: { equals: args.tierId } },
        { status: { in: ['pending', 'approved'] } },
    ];
    if (args.scopeId)
        clauses.push({ scope: { equals: args.scopeId } });
    else
        clauses.push({ scope: { exists: false } });
    const existing = await args.req.payload.find({
        collection: collectionOf('tierRequests'),
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
            collection: collectionOf('tierRequests'),
            data: {
                user: args.userId,
                scope: args.scopeId ?? undefined,
                tier: args.tierId,
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
 * When unlock rules pass and the tier requires review, ensure a pending/approved request exists.
 */
export async function syncTierProgression(args) {
    const scopeId = args.scopeId;
    const where = scopeId
        ? { or: [{ scope: { equals: scopeId } }, { scope: { exists: false } }] }
        : undefined;
    const result = await args.req.payload.find({
        collection: collectionOf('tiers'),
        depth: 0,
        limit: 100,
        pagination: false,
        overrideAccess: true,
        req: args.req,
        sort: 'rank',
        ...(where ? { where } : {}),
    });
    const tiers = [...result.docs].sort((a, b) => Number(a.rank ?? 0) - Number(b.rank ?? 0));
    let requested = 0;
    let ladderRank = null;
    for (const tier of tiers) {
        const unlocked = await evaluateRules({
            payload: args.req.payload,
            req: args.req,
            rules: tier.unlockRules,
            userId: args.userId,
            scopeId,
            ladderRank,
        });
        if (!unlocked)
            continue;
        if (tier.requiresReview === true) {
            const { created } = await ensureTierRequest({
                req: args.req,
                userId: args.userId,
                tierId: String(tier.id),
                scopeId,
            });
            const approved = await hasApprovedTierRequest({
                req: args.req,
                userId: args.userId,
                tierId: String(tier.id),
                scopeId,
            });
            if (!approved) {
                if (created)
                    requested += 1;
                break;
            }
        }
        ladderRank = Number(tier.rank ?? 0);
    }
    return { requested };
}
export { hasApprovedTierRequest } from './tierApproval.js';
