import type { Field } from 'payload'

import type { ResolvedAchievementOptions } from '../../defaults.js'

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
        collection: slugs.grants,
        on: 'user',
        admin: {
          // Create from the user doc — Payload pre-fills `user` on the grant drawer.
          allowCreate: true,
          defaultColumns: ['achievement', 'completedAt', 'scope'],
        },
      },
      {
        name: 'requests',
        type: 'join',
        collection: slugs.achievementRequests,
        on: 'user',
        admin: {
          allowCreate: false,
          defaultColumns: ['achievement', 'status', 'createdAt'],
        },
      },
    ],
  } as Field
}
