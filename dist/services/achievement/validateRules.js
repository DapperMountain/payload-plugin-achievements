import { APIError } from 'payload';
import { isBuiltinElapsedSince } from '../../extensions/elapsedSinceOptions.js';
import { getMetricAnchorResolver } from '../../extensions/metricAnchors.js';
import { relationId } from './relationId.js';
import { normalizeRuleGroup } from './evaluateRules.js';
/**
 * Validate a single rule node (leaf or group). Returns an error message or null.
 * Built-in types require their fields; unknown types are left to host extensions.
 */
export function validateRuleNode(rule) {
    const type = String(rule.type ?? '');
    if (type === 'group') {
        const children = Array.isArray(rule.rules) ? rule.rules : [];
        if (children.length === 0) {
            return 'A rule group needs at least one rule.';
        }
        for (const child of children) {
            const err = validateRuleNode(child);
            if (err)
                return err;
        }
        return null;
    }
    if (type === 'tier-at-least') {
        if (!relationId(rule.tier) && typeof rule.tierSlug !== 'string') {
            return 'Tier at least needs a tier.';
        }
        return null;
    }
    if (type === 'achievement-complete') {
        if (!relationId(rule.achievement) && typeof rule.achievementSlug !== 'string') {
            return 'Achievement complete needs an achievement.';
        }
        return null;
    }
    if (type === 'metric-minimum') {
        if (!relationId(rule.metric) && typeof rule.metricSlug !== 'string') {
            return 'Metric minimum needs a metric.';
        }
        if (typeof rule.minimum !== 'number' || Number.isNaN(rule.minimum)) {
            return 'Metric minimum needs a numeric minimum.';
        }
        return null;
    }
    if (type === 'event-count') {
        if (!relationId(rule.eventType) && typeof rule.eventTypeSlug !== 'string') {
            return 'Event count needs an event type.';
        }
        if (typeof rule.count !== 'number' || Number.isNaN(rule.count)) {
            return 'Event count needs a numeric count.';
        }
        return null;
    }
    if (type === 'elapsed-since') {
        const since = String(rule.since ?? 'user-created-at');
        if (since === 'first-event') {
            if (!relationId(rule.eventType) && typeof rule.eventTypeSlug !== 'string') {
                return 'Elapsed since (first event) needs an event type.';
            }
        }
        else if (!isBuiltinElapsedSince(since) && !getMetricAnchorResolver(since)) {
            // Host anchors (e.g. membership-granted) are registered via extensions.metricAnchors.
            return 'Elapsed since needs a valid since source.';
        }
        if (typeof rule.amount !== 'number' || Number.isNaN(rule.amount) || rule.amount < 0) {
            return 'Elapsed since needs a non-negative amount.';
        }
        const unit = rule.unit ?? 'days';
        if (unit !== 'days' && unit !== 'hours' && unit !== 'minutes') {
            return 'Elapsed since unit must be days, hours, or minutes.';
        }
        return null;
    }
    if (!type) {
        return 'Each rule needs a type.';
    }
    // Host extension types — no shared field schema to check.
    return null;
}
/** Walk a top-level rule group (or bare array) and return the first error, if any. */
export function validateRuleGroup(input) {
    const group = normalizeRuleGroup(input);
    for (const rule of group.rules) {
        const err = validateRuleNode(rule);
        if (err)
            return err;
    }
    return null;
}
/** Throw {@link APIError} when rules are incomplete (for collection hooks). */
export function assertRuleGroupValid(input, label) {
    const err = validateRuleGroup(input);
    if (err) {
        throw new APIError(`${label}: ${err}`, 400);
    }
}
