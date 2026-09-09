import { APIError } from 'payload';
import { DEFAULT_ACHIEVEMENT_METRIC_SLUG } from '../../catalog.js';
import { collectionOf } from '../../collections/helpers.js';
import { eventTypeRequiresActor } from './eventTypeRequiresActor.js';
import { applyMetricBalanceDelta } from './metricBalances.js';
import { transitionLogData, transitionToId } from './logData.js';
import { loadMetricDoc } from './resolveMetricValue.js';
import { resolveCatalogId } from './resolveCatalog.js';
import { resolveCurrentTier } from './resolveCurrentTier.js';
import { userScopeWhere } from './where.js';
async function catalogId(args) {
    return resolveCatalogId({
        payload: args.payload,
        req: args.req,
        key: args.key,
        slugOrId: args.value,
    });
}
/** Append a catalogued occurrence to the achievement log. */
export async function recordLog(args) {
    const scopeId = args.scopeId ?? null;
    const typeId = await catalogId({
        payload: args.payload,
        req: args.req,
        key: 'eventTypes',
        value: args.type,
    });
    const metricId = args.metric
        ? await catalogId({
            payload: args.payload,
            req: args.req,
            key: 'metrics',
            value: args.metric,
        })
        : undefined;
    if (await eventTypeRequiresActor({ payload: args.payload, req: args.req, typeIdOrDoc: typeId })) {
        if (!args.actorId) {
            throw new APIError('This log type needs an actor (who caused it).', 400);
        }
    }
    return args.payload.create({
        collection: collectionOf('logs'),
        data: {
            user: args.userId,
            scope: scopeId ?? undefined,
            type: typeId,
            actor: args.actorId ?? undefined,
            metric: metricId,
            change: args.change,
            reason: args.reason,
            data: args.data ?? undefined,
        },
        overrideAccess: true,
        req: args.req,
    });
}
/** @deprecated Prefer {@link recordLog}. */
export const recordEvent = recordLog;
/**
 * Record `metric.delta`, then sync an optional `tier.changed` audit log.
 */
export async function recordMetricChange(args) {
    const metricSlug = args.metric ?? DEFAULT_ACHIEVEMENT_METRIC_SLUG;
    const scopeId = args.scopeId ?? null;
    const metricDoc = await loadMetricDoc({
        payload: args.payload,
        req: args.req,
        metric: metricSlug,
    });
    if (!metricDoc) {
        throw new APIError(`Unknown metric "${metricSlug}".`, 400);
    }
    if ((metricDoc.kind ?? 'stored') === 'computed') {
        throw new APIError('Computed metrics cannot be changed with recordMetricChange.', 400);
    }
    const log = await recordLog({
        payload: args.payload,
        req: args.req,
        userId: args.userId,
        scopeId,
        type: 'metric.delta',
        actorId: args.actorId,
        metric: metricDoc.id,
        change: args.change,
        reason: args.reason,
    });
    await applyMetricBalanceDelta({
        payload: args.payload,
        req: args.req,
        userId: args.userId,
        scopeId,
        metricId: metricDoc.id,
        change: args.change,
    });
    if (args.req) {
        const { syncTierProgression } = await import('./tierProgression.js');
        await syncTierProgression({
            req: args.req,
            userId: args.userId,
            scopeId,
        });
    }
    await syncTierChangedLog({
        payload: args.payload,
        req: args.req,
        userId: args.userId,
        scopeId,
    });
    return log;
}
/** Write `tier.changed` when the ladder-derived tier differs from the latest audit entry. */
export async function syncTierChangedLog(args) {
    const scopeId = args.scopeId ?? null;
    const current = await resolveCurrentTier({
        payload: args.payload,
        req: args.req,
        userId: args.userId,
        scopeId,
    });
    const typeId = await catalogId({
        payload: args.payload,
        req: args.req,
        key: 'eventTypes',
        value: 'tier.changed',
    });
    const latest = await args.payload.find({
        collection: collectionOf('logs'),
        depth: 0,
        limit: 1,
        overrideAccess: true,
        req: args.req,
        sort: '-createdAt',
        where: {
            and: [userScopeWhere(args.userId, scopeId), { type: { equals: typeId } }],
        },
    });
    const latestData = latest.docs[0]?.data;
    const lastTierId = transitionToId(latestData);
    const currentId = current?.id ?? null;
    if (lastTierId === currentId)
        return null;
    if (!currentId)
        return null;
    let fromSlug;
    if (latestData && typeof latestData === 'object' && !Array.isArray(latestData)) {
        const record = latestData;
        const to = record.to;
        if (to && typeof to === 'object' && !Array.isArray(to)) {
            const slug = to.slug;
            if (typeof slug === 'string')
                fromSlug = slug;
        }
        else if (typeof record.tierSlug === 'string') {
            fromSlug = record.tierSlug;
        }
    }
    return recordLog({
        payload: args.payload,
        req: args.req,
        userId: args.userId,
        scopeId,
        type: 'tier.changed',
        data: transitionLogData({
            from: lastTierId ? { id: lastTierId, slug: fromSlug } : null,
            to: { id: currentId, slug: current?.slug },
        }),
    });
}
