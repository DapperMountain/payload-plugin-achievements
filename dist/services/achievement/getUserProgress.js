import { collectionOf } from '../../collections/helpers';
import { relationId } from './relationId';
import { resolveCurrentTier } from './resolveCurrentTier';
import { userScopeWhere } from './where';
function leanCatalog(value) {
    const id = relationId(value);
    if (!id)
        return null;
    if (!value || typeof value !== 'object')
        return { id };
    const row = value;
    return {
        id,
        ...(typeof row.name === 'string' && row.name ? { name: row.name } : {}),
        ...(typeof row.slug === 'string' && row.slug ? { slug: row.slug } : {}),
        ...(typeof row.description === 'string' && row.description
            ? { description: row.description }
            : {}),
    };
}
function leanGrant(doc) {
    return {
        id: doc.id,
        achievement: leanCatalog(doc.achievement),
        completedAt: doc.completedAt ?? null,
        note: doc.note ?? null,
        scopeId: relationId(doc.scope) ?? null,
        updatedAt: doc.updatedAt ?? null,
        createdAt: doc.createdAt ?? null,
    };
}
function leanRequest(doc) {
    return {
        id: doc.id,
        status: doc.status ?? null,
        achievement: leanCatalog(doc.achievement),
        reason: doc.reason ?? null,
        updatedAt: doc.updatedAt ?? null,
        createdAt: doc.createdAt ?? null,
    };
}
function mapPaginatedDocs(result, mapDoc) {
    return {
        docs: result.docs.map(mapDoc),
        hasNextPage: result.hasNextPage,
        hasPrevPage: result.hasPrevPage,
        limit: result.limit,
        nextPage: result.nextPage,
        page: result.page,
        pagingCounter: result.pagingCounter,
        prevPage: result.prevPage,
        totalDocs: result.totalDocs,
        totalPages: result.totalPages,
    };
}
async function resolveTiersForMe(args) {
    if (args.scopeId) {
        const tier = await resolveCurrentTier({
            payload: args.payload,
            req: args.req,
            userId: args.userId,
            scopeId: args.scopeId,
            locale: args.locale,
        });
        if (!tier)
            return [];
        return [
            {
                id: tier.id,
                rank: tier.rank,
                scopeId: tier.scopeId,
                ...(tier.name ? { name: tier.name } : {}),
                ...(tier.slug ? { slug: tier.slug } : {}),
            },
        ];
    }
    const grants = await args.payload.find({
        collection: collectionOf('grants'),
        depth: 0,
        limit: 100,
        pagination: false,
        overrideAccess: true,
        req: args.req,
        where: { user: { equals: args.userId } },
    });
    const scopeIds = new Set();
    for (const doc of grants.docs) {
        scopeIds.add(relationId(doc.scope));
    }
    if (scopeIds.size === 0)
        scopeIds.add(null);
    const tiers = [];
    for (const scopeId of scopeIds) {
        const tier = await resolveCurrentTier({
            payload: args.payload,
            req: args.req,
            userId: args.userId,
            scopeId,
            locale: args.locale,
        });
        if (!tier)
            continue;
        tiers.push({
            id: tier.id,
            rank: tier.rank,
            scopeId: tier.scopeId,
            ...(tier.name ? { name: tier.name } : {}),
            ...(tier.slug ? { slug: tier.slug } : {}),
        });
    }
    return tiers;
}
/**
 * Current-user snapshot. Top-level Payload `find` shape for **grants**;
 * ladder-derived `tiers` and lean `requests` ride along.
 */
export async function getUserProgress(args) {
    if (!args.userId) {
        throw new Error('getUserProgress requires userId');
    }
    const scopeId = args.scopeId ?? null;
    const where = userScopeWhere(args.userId, scopeId);
    const limit = args.paging?.limit ?? 10;
    const page = args.paging?.page ?? 1;
    const requestsLimit = args.paging?.requestsLimit ?? 20;
    const locale = args.locale ?? (args.req?.locale || undefined);
    const [grants, requests, tiers] = await Promise.all([
        args.payload.find({
            collection: collectionOf('grants'),
            depth: 1,
            limit,
            page,
            overrideAccess: true,
            req: args.req,
            sort: '-completedAt',
            where,
            ...(locale ? { locale: locale } : {}),
        }),
        args.payload.find({
            collection: collectionOf('achievementRequests'),
            depth: 1,
            limit: requestsLimit,
            page: 1,
            overrideAccess: true,
            req: args.req,
            sort: '-createdAt',
            where,
            ...(locale ? { locale: locale } : {}),
        }),
        resolveTiersForMe({
            payload: args.payload,
            req: args.req,
            userId: args.userId,
            scopeId,
            locale,
        }),
    ]);
    return {
        ...mapPaginatedDocs(grants, (doc) => leanGrant(doc)),
        tiers,
        requests: requests.docs.map((doc) => leanRequest(doc)),
    };
}
