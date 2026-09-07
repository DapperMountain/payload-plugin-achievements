import { APIError } from 'payload';
import { relationId } from './relationId';
import { normalizeRuleGroup } from './evaluateRules';
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
