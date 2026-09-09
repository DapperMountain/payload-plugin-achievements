import { collectionOf } from '../../collections/helpers.js';
import { relationId } from './relationId.js';
import { userScopeWhere } from './where.js';
export function metricBalanceKey(userId, scopeId, metricId) {
    return `${userId}:${scopeId ?? ''}:${metricId}`;
}
export async function findMetricBalance(args) {
    const key = metricBalanceKey(args.userId, args.scopeId, args.metricId);
    const found = await args.payload.find({
        collection: collectionOf('metricBalances'),
        depth: 0,
        limit: 1,
        overrideAccess: true,
        req: args.req,
        where: { key: { equals: key } },
    });
    const doc = found.docs[0];
    const id = relationId(doc);
    if (!id)
        return null;
    const value = typeof doc?.value === 'number' && Number.isFinite(doc.value) ? doc.value : 0;
    return { id, value };
}
export async function applyMetricBalanceDelta(args) {
    const existing = await findMetricBalance(args);
    const nextValue = (existing?.value ?? 0) + args.change;
    const key = metricBalanceKey(args.userId, args.scopeId, args.metricId);
    if (existing) {
        const updated = await args.payload.update({
            collection: collectionOf('metricBalances'),
            id: existing.id,
            data: { value: nextValue },
            overrideAccess: true,
            req: args.req,
        });
        return { id: existing.id, value: typeof updated.value === 'number' ? updated.value : nextValue };
    }
    const created = await args.payload.create({
        collection: collectionOf('metricBalances'),
        data: {
            user: args.userId,
            scope: args.scopeId ?? undefined,
            metric: args.metricId,
            value: nextValue,
            key,
        },
        overrideAccess: true,
        req: args.req,
    });
    return {
        id: String(created.id),
        value: typeof created.value === 'number' ? created.value : nextValue,
    };
}
/** Sum metric.delta log changes and upsert the balance projection. */
export async function rebuildMetricBalance(args) {
    const scopeId = args.scopeId ?? null;
    const logs = await args.payload.find({
        collection: collectionOf('logs'),
        depth: 0,
        limit: 10_000,
        pagination: false,
        overrideAccess: true,
        req: args.req,
        where: {
            and: [userScopeWhere(args.userId, scopeId), { metric: { equals: args.metricId } }],
        },
    });
    const value = logs.docs.reduce((sum, doc) => {
        const change = doc.change;
        return sum + (typeof change === 'number' && Number.isFinite(change) ? change : 0);
    }, 0);
    const existing = await findMetricBalance({
        payload: args.payload,
        req: args.req,
        userId: args.userId,
        scopeId,
        metricId: args.metricId,
    });
    const key = metricBalanceKey(args.userId, scopeId, args.metricId);
    if (existing) {
        await args.payload.update({
            collection: collectionOf('metricBalances'),
            id: existing.id,
            data: { value },
            overrideAccess: true,
            req: args.req,
        });
        return { id: existing.id, value };
    }
    const created = await args.payload.create({
        collection: collectionOf('metricBalances'),
        data: {
            user: args.userId,
            scope: scopeId ?? undefined,
            metric: args.metricId,
            value,
            key,
        },
        overrideAccess: true,
        req: args.req,
    });
    return { id: String(created.id), value };
}
/** Rebuild balances for every distinct metric seen in this user’s metric.delta logs. */
export async function rebuildMetricBalancesForUser(args) {
    const scopeId = args.scopeId ?? null;
    const logs = await args.payload.find({
        collection: collectionOf('logs'),
        depth: 0,
        limit: 10_000,
        pagination: false,
        overrideAccess: true,
        req: args.req,
        where: {
            and: [userScopeWhere(args.userId, scopeId), { metric: { exists: true } }],
        },
    });
    const metricIds = new Set();
    for (const doc of logs.docs) {
        const id = relationId(doc.metric);
        if (id)
            metricIds.add(id);
    }
    let rebuilt = 0;
    for (const metricId of metricIds) {
        await rebuildMetricBalance({
            payload: args.payload,
            req: args.req,
            userId: args.userId,
            scopeId,
            metricId,
        });
        rebuilt += 1;
    }
    return rebuilt;
}
