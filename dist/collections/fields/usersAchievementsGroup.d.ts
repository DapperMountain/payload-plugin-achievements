import type { Field } from 'payload';
import type { ResolvedAchievementOptions } from '../../defaults';
/**
 * Group on the users collection: reverse joins into grants + requests.
 * Nested JSON shape: `user.achievements.grants` / `.requests`.
 */
export declare function usersAchievementsGroup(options: ResolvedAchievementOptions): Field;
//# sourceMappingURL=usersAchievementsGroup.d.ts.map