import { getUserId } from '../access/helpers/index.js';
import { getAchievementOptions } from '../options-store.js';
import { reconcileProgression } from '../services/achievement/reconcile.js';
function requestUrl(req) {
    return req.url ? new URL(req.url, 'http://local') : null;
}
async function readBody(req) {
    try {
        if (typeof req.json === 'function') {
            const body = await req.json();
            if (body && typeof body === 'object')
                return body;
        }
    }
    catch {
        // empty body
    }
    return {};
}
function stringParam(body, url, keys) {
    for (const key of keys) {
        const fromBody = body[key];
        if (typeof fromBody === 'string' && fromBody.length > 0)
            return fromBody;
        const fromUrl = url?.searchParams.get(key);
        if (fromUrl && fromUrl.length > 0)
            return fromUrl;
    }
    return null;
}
/**
 * `POST` repair progression from existing grants / requests.
 * Body (optional): `{ userId?, scopeId?, achievementId?, achievementSlug?, tierId?, tierSlug?, limit? }`.
 * Requires host `canReview`.
 */
export function buildReconcileEndpoint(path) {
    return {
        path,
        method: 'post',
        handler: async (req) => {
            const actorId = getUserId(req);
            if (!actorId || !req.user) {
                return Response.json({ errors: [{ message: 'Unauthorized' }] }, { status: 401 });
            }
            const { canReview } = getAchievementOptions();
            if (!canReview) {
                return Response.json({ errors: [{ message: 'Forbidden' }] }, { status: 403 });
            }
            const body = await readBody(req);
            const url = requestUrl(req);
            const scopeId = stringParam(body, url, ['scopeId', 'scope']);
            if (!(await canReview(req.user, scopeId))) {
                return Response.json({ errors: [{ message: 'Forbidden' }] }, { status: 403 });
            }
            const limitRaw = body.limit;
            const limit = typeof limitRaw === 'number' && Number.isFinite(limitRaw)
                ? Math.floor(limitRaw)
                : undefined;
            const result = await reconcileProgression({
                payload: req.payload,
                req,
                scopeId,
                userId: stringParam(body, url, ['userId', 'user']),
                achievementId: stringParam(body, url, ['achievementId']),
                achievementSlug: stringParam(body, url, ['achievementSlug', 'achievement']),
                tierId: stringParam(body, url, ['tierId']),
                tierSlug: stringParam(body, url, ['tierSlug', 'tier']),
                limit,
            });
            return Response.json({ ok: true, ...result });
        },
    };
}
