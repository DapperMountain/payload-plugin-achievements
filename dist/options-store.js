import { resolveOptions } from './defaults';
let stored = null;
export function setAchievementOptions(options) {
    stored = resolveOptions(options);
}
/** Test helper — clears the process-wide options singleton. */
export function resetAchievementOptions() {
    stored = null;
}
export function getAchievementOptions() {
    if (!stored) {
        stored = resolveOptions({});
    }
    return stored;
}
