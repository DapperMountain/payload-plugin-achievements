export function catalogRef(id, slug) {
    return {
        id,
        ...(typeof slug === 'string' && slug.length > 0 ? { slug } : {}),
    };
}
export function transitionLogData(args) {
    return {
        from: args.from ? catalogRef(args.from.id, args.from.slug) : null,
        to: args.to ? catalogRef(args.to.id, args.to.slug) : null,
    };
}
/** Read the “current” catalog id from a log `data` blob (new or legacy shapes). */
export function transitionToId(data) {
    if (!data || typeof data !== 'object' || Array.isArray(data))
        return null;
    const record = data;
    const to = record.to;
    if (to && typeof to === 'object' && !Array.isArray(to)) {
        const id = to.id;
        if (typeof id === 'string' && id)
            return id;
    }
    // Legacy tier.changed / achievement.* shapes
    if (typeof record.tier === 'string' && record.tier)
        return record.tier;
    if (typeof record.achievement === 'string' && record.achievement)
        return record.achievement;
    return null;
}
