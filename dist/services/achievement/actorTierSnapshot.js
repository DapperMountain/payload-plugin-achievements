import { collectionOf } from '../../collections/helpers.js';
import { getAchievementOptions } from '../../options-store.js';
import { CTX_ACTOR_TIER_RESOLVE } from './contextFlags.js';
import { relationId } from './relationId.js';
import { resolveCurrentTier } from './resolveCurrentTier.js';
function resolveCache(req) {
    if (!req)
        return null;
    const context = (req.context ?? {});
    const existing = context[CTX_ACTOR_TIER_RESOLVE];
    if (existing instanceof Map)
        return existing;
    const created = new Map();
    req.context = { ...req.context, [CTX_ACTOR_TIER_RESOLVE]: created };
    return created;
}
function cacheKey(userId, scopeId) {
    return `${userId}:${scopeId ?? ''}`;
}
function pushUniqueScope(out, seen, id) {
    const key = id ?? '';
    if (seen.has(key))
        return;
    seen.add(key);
    out.push(id);
}
/**
 * Unscoped logs stamp every ladder (a later scoped count can still see the actor’s rank).
 * Scoped logs stamp that tenant plus any unscoped ranks.
 */
export function scopeIdsForActorSnapshot(args) {
    const out = [];
    const seen = new Set();
    if (args.logScopeId == null) {
        for (const id of args.ladderScopeIds)
            pushUniqueScope(out, seen, id);
        return out;
    }
    pushUniqueScope(out, seen, args.logScopeId);
    for (const id of args.ladderScopeIds) {
        if (id == null)
            pushUniqueScope(out, seen, null);
    }
    return out;
}
/** Normalize log `actorTiers` rows for matching. */
export function readActorTierSnapshotRows(value) {
    if (!Array.isArray(value))
        return [];
    const out = [];
    for (const row of value) {
        if (!row || typeof row !== 'object')
            continue;
        const rec = row;
        const rank = Number(rec.rank);
        if (!Number.isFinite(rank))
            continue;
        out.push({ scopeId: relationId(rec.scope) ?? null, rank });
    }
    return out;
}
/**
 * True when a snapshot includes this scope at rank ≥ `minimumRank`.
 * Missing snapshot (legacy logs) never matches — the event was not stamped.
 */
export function actorSnapshotMeetsTier(args) {
    return readActorTierSnapshotRows(args.rows).some((row) => row.scopeId === args.scopeId && row.rank >= args.minimumRank);
}
async function listLadderScopeIds(args) {
    if (!getAchievementOptions().scope?.collection)
        return [null];
    const { docs } = await args.payload.find({
        collection: collectionOf('tiers'),
        depth: 0,
        overrideAccess: true,
        pagination: false,
        req: args.req,
        select: { scope: true },
    });
    const ids = new Set();
    let unscoped = false;
    for (const doc of docs) {
        const scopeId = relationId(doc.scope);
        if (scopeId)
            ids.add(scopeId);
        else
            unscoped = true;
    }
    const out = [...ids];
    if (unscoped || out.length === 0)
        out.push(null);
    return out;
}
async function currentTierMemoized(args) {
    const cache = resolveCache(args.req);
    const key = cacheKey(args.userId, args.scopeId);
    const hit = cache?.get(key);
    if (hit)
        return hit;
    const pending = resolveCurrentTier({
        payload: args.payload,
        req: args.req,
        userId: args.userId,
        scopeId: args.scopeId,
    });
    cache?.set(key, pending);
    return pending;
}
/**
 * Read-only derived ladder ranks for an actor across configured scopes.
 * Does not reconcile, grant, or open tier requests.
 */
export async function snapshotActorDerivedTiers(args) {
    if (!args.userId)
        return [];
    const ladderScopeIds = await listLadderScopeIds({ payload: args.payload, req: args.req });
    const scopeIds = scopeIdsForActorSnapshot({
        logScopeId: args.logScopeId ?? null,
        ladderScopeIds,
    });
    const rows = [];
    for (const scopeId of scopeIds) {
        const current = await currentTierMemoized({
            payload: args.payload,
            req: args.req,
            userId: args.userId,
            scopeId,
        });
        if (!current)
            continue;
        rows.push({
            ...(scopeId ? { scope: scopeId } : {}),
            tier: current.id,
            rank: current.rank,
        });
    }
    return rows;
}
