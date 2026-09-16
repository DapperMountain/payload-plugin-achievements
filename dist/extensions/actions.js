import { getAchievementOptions } from '../options-store.js';
export const BUILTIN_GRANT_ACTION = 'achievement.grant';
/** Host actions whose `type` is not the built-in grant command. */
export function getHostActions() {
    const out = [];
    const seen = new Set([BUILTIN_GRANT_ACTION]);
    for (const action of getAchievementOptions().extensions?.actions ?? []) {
        if (!action.type || seen.has(action.type))
            continue;
        seen.add(action.type);
        out.push(action);
    }
    return out;
}
export function getHostAction(type) {
    return getHostActions().find((action) => action.type === type) ?? null;
}
export function actionSelectOptions() {
    return [
        { label: 'Grant achievement', value: BUILTIN_GRANT_ACTION },
        ...getHostActions().map((action) => ({
            label: action.label ?? action.type,
            value: action.type,
        })),
    ];
}
