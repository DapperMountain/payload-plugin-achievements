import { collectionOf } from '../../collections/helpers';
import { evaluateRules } from './evaluateRules';
import { relationId } from './relationId';
/**
 * Derive current tier by walking unlock rules in rank order (lowest first).
 * Empty unlock rules pass. `tier-at-least` uses the rank unlocked so far on this walk.
 */
export async function resolveCurrentTier(args) {
    if (!args.userId)
        return null;
    const scopeId = args.scopeId ?? null;
    const locale = args.locale ?? (args.req?.locale || undefined);
    const where = scopeId
        ? { or: [{ scope: { equals: scopeId } }, { scope: { exists: false } }] }
        : undefined;
    const result = await args.payload.find({
        collection: collectionOf('tiers'),
        depth: 0,
        limit: 100,
        pagination: false,
        overrideAccess: true,
        req: args.req,
        sort: 'rank',
        ...(locale ? { locale: locale } : {}),
        ...(where ? { where } : {}),
    });
    const tiers = [...result.docs].sort((a, b) => Number(a.rank ?? 0) - Number(b.rank ?? 0));
    // evaluateRules requires a PayloadRequest; synthesize a minimal one when only payload is passed.
    const req = (args.req ?? { payload: args.payload });
    let current = null;
    for (const tier of tiers) {
        const unlocked = await evaluateRules({
            payload: args.payload,
            req,
            rules: tier.unlockRules,
            userId: args.userId,
            scopeId,
            ladderRank: current?.rank ?? null,
        });
        if (!unlocked)
            continue;
        current = {
            id: String(tier.id),
            rank: Number(tier.rank ?? 0),
            scopeId: relationId(tier.scope),
            ...(typeof tier.name === 'string' && tier.name ? { name: tier.name } : {}),
            ...(typeof tier.slug === 'string' && tier.slug ? { slug: tier.slug } : {}),
        };
    }
    return current;
}
