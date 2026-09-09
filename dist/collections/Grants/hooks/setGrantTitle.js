import { relationId } from '../../../services/achievement/relationId.js';
import { collectionOf } from '../../helpers.js';
async function achievementName(args) {
    const id = relationId(args.value);
    if (!id)
        return 'Grant';
    if (args.value && typeof args.value === 'object') {
        const row = args.value;
        if (typeof row.name === 'string' && row.name)
            return row.name;
    }
    try {
        const doc = await args.payload.findByID({
            collection: collectionOf('achievements'),
            id,
            depth: 0,
            overrideAccess: true,
            req: args.req,
            ...(args.req?.locale ? { locale: args.req.locale } : {}),
        });
        const name = doc?.name;
        return typeof name === 'string' && name ? name : id;
    }
    catch {
        return id;
    }
}
export const setGrantTitle = async ({ data, originalDoc, req }) => {
    if (!req?.payload || !data)
        return data;
    data.title = await achievementName({
        payload: req.payload,
        req,
        value: data.achievement ?? originalDoc?.achievement,
    });
    return data;
};
export const fillGrantTitle = async ({ doc, req }) => {
    if (!req?.payload || !doc)
        return doc;
    doc.title = await achievementName({
        payload: req.payload,
        req,
        value: doc.achievement,
    });
    return doc;
};
