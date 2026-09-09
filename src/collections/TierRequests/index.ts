import type { CollectionConfig, Field } from 'payload'

import { collectionAdmin, collectionOf, optionalFields, slugOf } from '../helpers.js'
import { scopeField, userField } from '../fields/index.js'
import { access } from './access/index.js'
import { hooks } from './hooks/index.js'

export function buildTierRequestsCollection(): CollectionConfig {
  return {
    slug: slugOf('tierRequests'),
    labels: {
      singular: 'Tier Request',
      plural: 'Tier Requests',
    },
    access: { ...access },
    hooks,
    admin: collectionAdmin({
      useAsTitle: 'id',
      defaultColumns: ['user', 'tier', 'status', 'createdAt'],
      description:
        'When a member has met a tier’s unlock rules but that tier requires review before it becomes their current tier.',
    }),
    fields: [
      ...optionalFields(scopeField()),
      userField(),
      {
        name: 'tier',
        type: 'relationship',
        relationTo: collectionOf('tiers'),
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
      {
        name: 'note',
        type: 'textarea',
        admin: { description: 'Optional note from the reviewer.' },
      },
    ],
  }
}
