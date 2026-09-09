import { getAchievementOptions } from '../../options-store.js';
/** Relationship to the users collection. */
export function userField() {
    const users = getAchievementOptions().usersCollectionSlug ?? 'users';
    return {
        name: 'user',
        type: 'relationship',
        relationTo: users,
        required: true,
        index: true,
    };
}
