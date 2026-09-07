import type { CollectionConfig, Field } from 'payload'

import { collectionAdmin, collectionOf, optionalFields, slugOf } from '../helpers'
import { scopeField, userField } from '../fields'
import { access } from './access'
import { hooks } from './hooks'

export function buildAchievementRequestsCollection(): CollectionConfig {
  return {
    slug: slugOf('achievementRequests'),
    access: { ...access },
    hooks,
    admin: collectionAdmin({
      useAsTitle: 'id',
      defaultColumns: ['user', 'achievement', 'status', 'createdAt'],
      description:
        'When someone asks to earn an achievement. We check eligibility, then either grant it right away or wait for a review.',
    }),
    fields: [
      ...optionalFields(scopeField()),
      userField(),
      {
        name: 'achievement',
        type: 'relationship',
        relationTo: collectionOf('achievements'),
        required: true,
        index: true,
      } as Field,
      {
        name: 'status',
        type: 'select',
        required: true,
        defaultValue: 'pending',
        options: [
          { label: 'Pending', value: 'pending' },
          { label: 'Approved', value: 'approved' },
          { label: 'Rejected', value: 'rejected' },
        ],
      },
      { name: 'note', type: 'textarea', admin: { description: 'Optional note from the requester or reviewer.' } },
    ],
  }
}
