import { getAchievementOptions } from '../options-store.js';
import { builtInRuleTypes } from '../services/achievement/builtInRules.js';
const BUILTIN_RULE_SELECT_TYPES = new Set([
    'tier-at-least',
    'achievement-complete',
    'metric-minimum',
    'event-count',
    'group',
]);
export function getRuleTypeMap() {
    const map = new Map();
    for (const rule of builtInRuleTypes) {
        map.set(rule.type, rule);
    }
    for (const rule of getAchievementOptions().extensions?.ruleTypes ?? []) {
        map.set(rule.type, rule);
    }
    return map;
}
/** Host rule types that can appear in the Admin type select (skips built-in keys). */
export function getHostRuleTypeAdminEntries() {
    const out = [];
    const seen = new Set();
    for (const rule of getAchievementOptions().extensions?.ruleTypes ?? []) {
        if (!rule.type || BUILTIN_RULE_SELECT_TYPES.has(rule.type) || seen.has(rule.type))
            continue;
        seen.add(rule.type);
        out.push(rule);
    }
    return out;
}
