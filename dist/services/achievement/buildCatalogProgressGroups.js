import { relationId } from './relationId.js';
import { collectAchievementCompleteRefs } from './evaluateRules.js';
function grantKey(achievement) {
    const id = relationId(achievement);
    const slug = achievement && typeof achievement === 'object' && 'slug' in achievement
        ? String(achievement.slug ?? '')
        : '';
    return { id, slug };
}
/**
 * Groups catalog achievements by composite parents (`completionRules`).
 * Children follow completion-rule order. Unearned children stay in the list with `earned: false`.
 */
export function buildCatalogProgressGroups(args) {
    const grantsById = new Map();
    const grantsBySlug = new Map();
    for (const grant of args.grants) {
        const key = grantKey(grant.achievement);
        if (key.id)
            grantsById.set(key.id, grant);
        if (key.slug)
            grantsBySlug.set(key.slug, grant);
    }
    const byId = new Map(args.achievements.map((doc) => [doc.id, doc]));
    const bySlug = new Map(args.achievements
        .filter((doc) => doc.slug)
        .map((doc) => [String(doc.slug), doc]));
    const toItem = (doc) => {
        const grant = grantsById.get(doc.id) ?? (doc.slug ? grantsBySlug.get(doc.slug) : undefined);
        return {
            id: doc.id,
            earned: Boolean(grant),
            ...(typeof doc.name === 'string' && doc.name ? { name: doc.name } : {}),
            ...(typeof doc.slug === 'string' && doc.slug ? { slug: doc.slug } : {}),
            ...(typeof doc.description === 'string' && doc.description
                ? { description: doc.description }
                : {}),
            completedAt: grant?.completedAt ?? null,
        };
    };
    const parents = [];
    for (const doc of args.achievements) {
        const refs = collectAchievementCompleteRefs(doc.completionRules);
        if (refs.length === 0)
            continue;
        parents.push(doc);
    }
    const groups = parents.map((parent) => {
        const refs = collectAchievementCompleteRefs(parent.completionRules);
        const items = [];
        const seen = new Set();
        for (const ref of refs) {
            const child = (ref.id && byId.get(ref.id)) || (ref.slug ? bySlug.get(ref.slug) : undefined);
            if (!child || seen.has(child.id))
                continue;
            seen.add(child.id);
            items.push(toItem(child));
        }
        return {
            id: parent.id,
            title: parent.name || parent.slug || parent.id,
            ...(parent.slug ? { slug: parent.slug } : {}),
            ...(typeof parent.description === 'string' && parent.description
                ? { description: parent.description }
                : {}),
            items,
        };
    });
    return groups;
}
