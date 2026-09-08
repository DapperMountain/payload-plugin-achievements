import { CTX_CASCADING_REVOKE, CTX_SKIP_GRANT_SIDE_EFFECTS, runAfterGrantCreated, runAfterGrantDeleted } from '../../../services/achievement/grantSideEffects';
import { relationId } from '../../../services/achievement/relationId';
import { collectionOf } from '../../../collections/helpers';
async function achievementSlug(req, achievementId) {
    try {
        const def = (await req.payload.findByID({
            collection: collectionOf('achievements'),
            id: achievementId,
            depth: 0,
            overrideAccess: true,
            req,
            select: { slug: true },
        }));
        return def?.slug;
    }
    catch {
        return undefined;
    }
}
export const afterGrantChange = async ({ doc, operation, req }) => {
    if (operation !== 'create')
        return doc;
    if (req.context?.[CTX_SKIP_GRANT_SIDE_EFFECTS])
        return doc;
    const userId = relationId(doc.user);
    const achievementId = relationId(doc.achievement);
    if (!userId || !achievementId)
        return doc;
    const scopeId = relationId(doc.scope);
    await runAfterGrantCreated({
        req,
        userId,
        achievementId,
        scopeId,
        achievementSlug: await achievementSlug(req, achievementId),
    });
    return doc;
};
export const afterGrantDelete = async ({ doc, req }) => {
    if (req.context?.[CTX_SKIP_GRANT_SIDE_EFFECTS])
        return doc;
    const userId = relationId(doc.user);
    const achievementId = relationId(doc.achievement);
    if (!userId || !achievementId)
        return doc;
    const scopeId = relationId(doc.scope);
    await runAfterGrantDeleted({
        req,
        userId,
        achievementId,
        scopeId,
        achievementSlug: await achievementSlug(req, achievementId),
        cascading: Boolean(req.context?.[CTX_CASCADING_REVOKE]),
    });
    return doc;
};
