import { eachRuleLeaf } from '../../collections/hooks/eachRuleLeaf.js';
import { collectionOf } from '../../collections/helpers.js';
import { evaluateRuleProgress, evaluateRules } from './evaluateRules.js';
import { relationId } from './relationId.js';
export const UNLOCK_REQUIREMENT_RELATION_FIELDS = {
    tier: 'tiers',
    achievement: 'achievements',
    metric: 'metrics',
    eventType: 'eventTypes',
};
function relationName(value) {
    if (value && typeof value === 'object' && 'name' in value) {
        const name = value.name;
        if (typeof name === 'string' && name)
            return name;
    }
    return null;
}
function relationSlug(value) {
    if (value && typeof value === 'object' && 'slug' in value) {
        const slug = value.slug;
        if (typeof slug === 'string' && slug)
            return slug;
    }
    return null;
}
function slugField(rule, relationKey) {
    const raw = rule[`${relationKey}Slug`];
    return typeof raw === 'string' && raw ? raw : null;
}
function numericTarget(rule) {
    for (const key of ['amount', 'minimum', 'count']) {
        const value = rule[key];
        if (typeof value === 'number' && Number.isFinite(value) && value >= 0)
            return value;
    }
    return null;
}
async function resolveCatalogName(args) {
    const named = relationName(args.value);
    const slug = args.slug || relationSlug(args.value);
    const id = relationId(args.value);
    if (named) {
        return {
            ...(id ? { id } : {}),
            ...(slug ? { slug } : {}),
            name: named,
        };
    }
    if (slug) {
        const cached = args.cache.get(`slug:${args.collectionKey}:${slug}`);
        if (cached)
            return { ...(id ? { id } : {}), slug, name: cached };
    }
    if (id) {
        const cached = args.cache.get(`id:${args.collectionKey}:${id}`);
        if (cached) {
            return { id, ...(slug ? { slug } : {}), name: cached };
        }
        try {
            const doc = (await args.payload.findByID({
                collection: collectionOf(args.collectionKey),
                id,
                depth: 0,
                overrideAccess: true,
                req: args.req,
                ...(args.locale ? { locale: args.locale } : {}),
            }));
            const name = (typeof doc?.name === 'string' && doc.name) ||
                (typeof doc?.slug === 'string' && doc.slug) ||
                null;
            if (name) {
                args.cache.set(`id:${args.collectionKey}:${id}`, name);
                if (doc?.slug)
                    args.cache.set(`slug:${args.collectionKey}:${doc.slug}`, name);
                return { id, ...(doc?.slug ? { slug: doc.slug } : slug ? { slug } : {}), name };
            }
        }
        catch {
            /* fall through */
        }
    }
    if (slug && !id) {
        try {
            const found = await args.payload.find({
                collection: collectionOf(args.collectionKey),
                depth: 0,
                limit: 1,
                overrideAccess: true,
                req: args.req,
                where: { slug: { equals: slug } },
                ...(args.locale ? { locale: args.locale } : {}),
            });
            const doc = found.docs[0];
            const resolvedId = relationId(doc);
            const name = (typeof doc?.name === 'string' && doc.name) ||
                (typeof doc?.slug === 'string' && doc.slug) ||
                slug;
            if (resolvedId)
                args.cache.set(`id:${args.collectionKey}:${resolvedId}`, name);
            args.cache.set(`slug:${args.collectionKey}:${slug}`, name);
            return { ...(resolvedId ? { id: resolvedId } : {}), slug, name };
        }
        catch {
            /* fall through */
        }
    }
    return {
        ...(id ? { id } : {}),
        ...(slug ? { slug } : {}),
        ...(slug || id ? { name: slug || id || undefined } : {}),
    };
}
/**
 * Walk every leaf in a rule tree, evaluate met/progress, and return catalog-backed
 * subjects. Payload rows often carry empty `rules: []` + default combinator — those
 * are still leaves ({@link eachRuleLeaf}).
 *
 * `achievement-complete` is omitted by default so hosts can keep those on catalog groups.
 */
export async function buildUnlockRequirementLeaves(args) {
    const req = args.req ?? { payload: args.payload };
    const cache = new Map();
    const leaves = [];
    eachRuleLeaf(args.rules, (rule) => {
        const type = String(rule.type ?? '');
        if (!type)
            return;
        if (type === 'achievement-complete' && !args.includeAchievementComplete)
            return;
        leaves.push(rule);
    });
    const out = [];
    for (let index = 0; index < leaves.length; index += 1) {
        const rule = leaves[index];
        const type = String(rule.type);
        const leafRules = [rule];
        const met = await evaluateRules({
            payload: args.payload,
            req,
            rules: leafRules,
            userId: args.userId,
            scopeId: args.scopeId,
            ladderRank: args.ladderRank,
        });
        const progress = await evaluateRuleProgress({
            payload: args.payload,
            req,
            rules: leafRules,
            userId: args.userId,
            scopeId: args.scopeId,
            ladderRank: args.ladderRank,
        });
        const relations = [];
        for (const [field, collectionKey] of Object.entries(UNLOCK_REQUIREMENT_RELATION_FIELDS)) {
            const key = field;
            if (rule[key] == null && !slugField(rule, key))
                continue;
            const resolved = await resolveCatalogName({
                payload: args.payload,
                req,
                locale: args.locale,
                collectionKey,
                value: rule[key],
                slug: slugField(rule, key),
                cache,
            });
            if (!resolved.id && !resolved.slug && !resolved.name)
                continue;
            relations.push({ field: key, collectionKey, ...resolved });
        }
        const target = numericTarget(rule);
        const unit = typeof rule.unit === 'string' && rule.unit ? rule.unit : undefined;
        // `since` / `unit` only matter when a duration/count target is set (defaults pollute other leaves).
        const since = target != null && typeof rule.since === 'string' && rule.since ? rule.since : undefined;
        const subjectKey = relations
            .map((row) => row.name || row.slug || row.id)
            .filter(Boolean)
            .join(':') || 'leaf';
        out.push({
            id: `${type}:${index}:${subjectKey}`,
            type,
            met,
            progress,
            relations,
            ...(target != null ? { target } : {}),
            ...(unit ? { unit } : {}),
            ...(since ? { since } : {}),
        });
    }
    return out;
}
