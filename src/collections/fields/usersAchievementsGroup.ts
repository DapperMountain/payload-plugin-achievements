import type { Field } from 'payload'

import type { ResolvedAchievementOptions } from '../../defaults'

/**
 * Group on the users collection: reverse joins into grants + requests.
 * Nested JSON shape: `user.achievements.grants` / `.requests`.
 */
export function usersAchievementsGroup(options: ResolvedAchievementOptions): Field {
  const slugs = options.collectionSlugs

  return {
    name: 'achievements',
    type: 'group',
    admin: {
      description: 'Their grants and open requests.',
    },
    fields: [
      {
        name: 'grants',
        type: 'join',
        collection: slugs.grants as 'users',
        on: 'user',
        admin: {
          allowCreate: false,
          defaultColumns: ['achievement', 'completedAt', 'scope'],
        },
      },
      {
        name: 'requests',
        type: 'join',
        collection: slugs.achievementRequests as 'users',
        on: 'user',
        admin: {
          allowCreate: false,
          defaultColumns: ['achievement', 'status', 'createdAt'],
        },
      },
    ],
  }
}
