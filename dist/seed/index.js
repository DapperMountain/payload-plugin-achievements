import { ENGINE_EVENT_TYPES, ENGINE_METRICS } from '../catalog.js';
import { collectionOf } from '../collections/helpers.js';
import { plainTextToLexical } from '../fields/plainTextToLexical.js';
import { normalizeRuleGroup } from '../services/achievement/evaluateRules.js';
function localizedParts(value) {
    if (value == null)
        return {};
    if (typeof value === 'string')
        return { en: value };
    const out = {};
    for (const [locale, text] of Object.entries(value)) {
        if (typeof text === 'string' && text.length > 0)
            out[locale] = text;
    }
    return out;
}
async function writeLocalizedFields(payload, args) {
    const nameParts = localizedParts(args.fields.name);
    const descriptionParts = localizedParts(args.fields.description);
    const base = args.baseData ?? {};
    const locales = new Set([...Object.keys(nameParts), ...Object.keys(descriptionParts)]);
    // Default locale first so other locales can fall back cleanly.
    const orderedLocales = ['en', ...[...locales].filter((locale) => locale !== 'en')];
    for (const locale of orderedLocales) {
        const name = nameParts[locale];
        const description = descriptionParts[locale];
        if (name == null && description == null && locale !== 'en')
            continue;
        await payload.update({
            collection: args.collection,
            id: args.id,
            data: {
                ...(locale === 'en' ? base : {}),
                ...(name != null ? { name } : {}),
                ...(description != null ? { description: plainTextToLexical(description) } : {}),
            },
            locale: locale,
            overrideAccess: true,
        });
    }
}
async function findIdBySlug(payload, key, slug) {
    const result = await payload.find({
        collection: collectionOf(key),
        depth: 0,
        limit: 1,
        overrideAccess: true,
        where: { slug: { equals: slug } },
    });
    const id = result.docs[0]?.id;
    return typeof id === 'string' ? id : null;
}
async function upsertCatalog(payload, key, row) {
    const existing = await findIdBySlug(payload, key, row.slug);
    const nameParts = localizedParts(row.name);
    let metricComputed = {};
    if (key === 'metrics') {
        metricComputed = { kind: row.kind ?? 'stored' };
        if (row.kind === 'computed') {
            metricComputed.compute = row.compute ?? 'elapsed';
            metricComputed.unit = row.unit ?? 'days';
            metricComputed.since = row.since ?? 'user-created-at';
            if (row.eventTypeSlug) {
                metricComputed.eventType = await findIdBySlug(payload, 'eventTypes', row.eventTypeSlug);
            }
        }
    }
    const data = {
        name: nameParts.en ?? row.slug,
        slug: row.slug,
        scope: row.scope,
        system: row.system ?? false,
        ...(key === 'eventTypes'
            ? {
                requiresActor: row.requiresActor ?? false,
                requiresMetric: row.requiresMetric ?? false,
            }
            : metricComputed),
    };
    let id = existing;
    if (existing) {
        await payload.update({
            collection: collectionOf(key),
            id: existing,
            data,
            locale: 'en',
            overrideAccess: true,
        });
    }
    else {
        const created = await payload.create({
            collection: collectionOf(key),
            data,
            locale: 'en',
            overrideAccess: true,
        });
        id = String(created.id);
    }
    if (id) {
        const extraLocales = Object.entries(nameParts).filter(([locale]) => locale !== 'en');
        for (const [locale, name] of extraLocales) {
            await payload.update({
                collection: collectionOf(key),
                id,
                data: { name },
                locale: locale,
                overrideAccess: true,
            });
        }
    }
}
async function resolveRuleNode(payload, rule) {
    const next = { ...rule };
    if (next.type === 'group' && Array.isArray(next.rules)) {
        const children = [];
        for (const child of next.rules) {
            // Sequential: Payload/pg clients warn (and will error in pg@9) if queries overlap.
            children.push(await resolveRuleNode(payload, child));
        }
        next.rules = children;
        return next;
    }
    if (next.type === 'tier-at-least' && !next.tier && typeof next.tierSlug === 'string') {
        const id = await findIdBySlug(payload, 'tiers', next.tierSlug);
        if (id) {
            next.tier = id;
            delete next.tierSlug;
        }
    }
    if (next.type === 'achievement-complete' &&
        !next.achievement &&
        typeof next.achievementSlug === 'string') {
        const id = await findIdBySlug(payload, 'achievements', next.achievementSlug);
        if (id) {
            next.achievement = id;
            delete next.achievementSlug;
        }
    }
    if (next.type === 'event-count') {
        const slug = typeof next.eventTypeSlug === 'string'
            ? next.eventTypeSlug
            : typeof next.eventType === 'string'
                ? next.eventType
                : '';
        if (slug) {
            const id = await findIdBySlug(payload, 'eventTypes', slug);
            if (id) {
                next.eventType = id;
                delete next.eventTypeSlug;
            }
        }
    }
    if (next.type === 'metric-minimum') {
        const slug = typeof next.metricSlug === 'string' ? next.metricSlug : typeof next.metric === 'string' ? next.metric : '';
        if (slug) {
            const id = await findIdBySlug(payload, 'metrics', slug);
            if (id) {
                next.metric = id;
                delete next.metricSlug;
            }
        }
    }
    return next;
}
async function resolveRuleGroup(payload, input) {
    const group = normalizeRuleGroup(input);
    const rules = [];
    for (const rule of group.rules) {
        rules.push(await resolveRuleNode(payload, rule));
    }
    return {
        combinator: group.combinator,
        rules,
    };
}
/** Upsert engine event types + metrics (`system: true`). English (default locale) only. */
export async function seedAchievementCatalog(payload, scope) {
    await renameEngineEventTypeSlug(payload, 'metric.change', 'metric.delta', 'Metric delta');
    for (const row of ENGINE_EVENT_TYPES) {
        await upsertCatalog(payload, 'eventTypes', {
            ...row,
            name: row.name,
            scope,
            system: true,
        });
    }
    for (const row of ENGINE_METRICS) {
        await upsertCatalog(payload, 'metrics', {
            ...row,
            name: row.name,
            scope,
            system: true,
        });
    }
}
/** Rename a leftover engine event-type slug in place (preserves relationship ids). */
async function renameEngineEventTypeSlug(payload, fromSlug, toSlug, name) {
    const fromId = await findIdBySlug(payload, 'eventTypes', fromSlug);
    if (!fromId)
        return;
    if (await findIdBySlug(payload, 'eventTypes', toSlug))
        return;
    const nameParts = localizedParts(name);
    await payload.update({
        collection: collectionOf('eventTypes'),
        id: fromId,
        data: { slug: toSlug, name: nameParts.en ?? toSlug, system: true },
        locale: 'en',
        overrideAccess: true,
    });
    for (const [locale, text] of Object.entries(nameParts)) {
        if (locale === 'en' || !text)
            continue;
        await payload.update({
            collection: collectionOf('eventTypes'),
            id: fromId,
            data: { name: text },
            locale: locale,
            overrideAccess: true,
        });
    }
}
/**
 * Idempotent upsert of achievement definitions by slug. Host supplies its own catalog and ladder data.
 */
export async function seedAchievements(payload, input) {
    for (const row of input.eventTypes ?? []) {
        await upsertCatalog(payload, 'eventTypes', row);
    }
    for (const row of input.metrics ?? []) {
        await upsertCatalog(payload, 'metrics', row);
    }
    for (const tier of input.tiers ?? []) {
        const existing = await payload.find({
            collection: collectionOf('tiers'),
            depth: 0,
            limit: 1,
            overrideAccess: true,
            where: { slug: { equals: tier.slug } },
        });
        const nameParts = localizedParts(tier.name);
        const baseData = {
            slug: tier.slug,
            rank: tier.rank,
            scope: tier.scope,
            requiresReview: tier.requiresReview ?? false,
            ...(tier.icon ? { icon: tier.icon } : {}),
            ...(tier.image ? { image: tier.image } : {}),
            unlockRules: { combinator: 'and', rules: [] },
        };
        let id = existing.docs[0]?.id;
        if (id) {
            await writeLocalizedFields(payload, {
                collection: collectionOf('tiers'),
                id: String(id),
                fields: { name: tier.name, description: tier.description },
                baseData,
            });
        }
        else {
            const created = await payload.create({
                collection: collectionOf('tiers'),
                data: {
                    ...baseData,
                    name: nameParts.en ?? tier.slug,
                    ...(localizedParts(tier.description).en != null
                        ? { description: plainTextToLexical(localizedParts(tier.description).en) }
                        : {}),
                },
                locale: 'en',
                overrideAccess: true,
            });
            id = String(created.id);
            await writeLocalizedFields(payload, {
                collection: collectionOf('tiers'),
                id,
                fields: { name: tier.name, description: tier.description },
            });
        }
    }
    for (const achievement of input.achievements ?? []) {
        const existing = await payload.find({
            collection: collectionOf('achievements'),
            depth: 0,
            limit: 1,
            overrideAccess: true,
            where: { slug: { equals: achievement.slug } },
        });
        const nameParts = localizedParts(achievement.name);
        const descriptionParts = localizedParts(achievement.description);
        const eligibilityRules = await resolveRuleGroup(payload, achievement.eligibilityRules);
        const completionRules = { combinator: 'and', rules: [] };
        const baseData = {
            slug: achievement.slug,
            scope: achievement.scope,
            requiresReview: achievement.requiresReview ?? true,
            eligibilityRules,
            completionRules,
        };
        const existingId = existing.docs[0]?.id;
        if (existingId) {
            await writeLocalizedFields(payload, {
                collection: collectionOf('achievements'),
                id: String(existingId),
                fields: { name: achievement.name, description: achievement.description },
                baseData,
            });
        }
        else {
            const created = await payload.create({
                collection: collectionOf('achievements'),
                data: {
                    ...baseData,
                    name: nameParts.en ?? achievement.slug,
                    ...(descriptionParts.en != null
                        ? { description: plainTextToLexical(descriptionParts.en) }
                        : {}),
                },
                locale: 'en',
                overrideAccess: true,
            });
            const id = String(created.id);
            await writeLocalizedFields(payload, {
                collection: collectionOf('achievements'),
                id,
                fields: { name: achievement.name, description: achievement.description },
            });
        }
    }
    for (const achievement of input.achievements ?? []) {
        if (!achievement.completionRules)
            continue;
        const hasRules = Array.isArray(achievement.completionRules)
            ? achievement.completionRules.length > 0
            : Boolean(achievement.completionRules.rules?.length);
        if (!hasRules)
            continue;
        const existing = await payload.find({
            collection: collectionOf('achievements'),
            depth: 0,
            limit: 1,
            overrideAccess: true,
            where: { slug: { equals: achievement.slug } },
        });
        const doc = existing.docs[0];
        if (!doc)
            continue;
        await payload.update({
            collection: collectionOf('achievements'),
            id: doc.id,
            data: {
                completionRules: await resolveRuleGroup(payload, achievement.completionRules),
            },
            overrideAccess: true,
        });
    }
    // Unlock rules can reference achievements — apply after those rows exist.
    for (const tier of input.tiers ?? []) {
        if (!tier.unlockRules)
            continue;
        const hasRules = Array.isArray(tier.unlockRules)
            ? tier.unlockRules.length > 0
            : Boolean(tier.unlockRules.rules?.length);
        if (!hasRules)
            continue;
        const existing = await payload.find({
            collection: collectionOf('tiers'),
            depth: 0,
            limit: 1,
            overrideAccess: true,
            where: { slug: { equals: tier.slug } },
        });
        const doc = existing.docs[0];
        if (!doc)
            continue;
        await payload.update({
            collection: collectionOf('tiers'),
            id: doc.id,
            data: {
                unlockRules: await resolveRuleGroup(payload, tier.unlockRules),
            },
            overrideAccess: true,
        });
    }
    for (const slug of input.removeAchievementSlugs ?? []) {
        const id = await findIdBySlug(payload, 'achievements', slug);
        if (!id)
            continue;
        try {
            await payload.delete({
                collection: collectionOf('achievements'),
                id,
                overrideAccess: true,
            });
        }
        catch (error) {
            payload.logger.warn(`Could not remove obsolete achievement slug "${slug}": ${error instanceof Error ? error.message : String(error)}`);
        }
    }
}
