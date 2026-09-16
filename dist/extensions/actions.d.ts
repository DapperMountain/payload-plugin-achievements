import type { Option } from 'payload';
import type { AchievementAction } from '../types.js';
export declare const BUILTIN_GRANT_ACTION = "achievement.grant";
/** Host actions whose `type` is not the built-in grant command. */
export declare function getHostActions(): AchievementAction[];
export declare function getHostAction(type: string): AchievementAction | null;
export declare function actionSelectOptions(): Option[];
//# sourceMappingURL=actions.d.ts.map