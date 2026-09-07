import type { CollectionConfig } from 'payload'

import { collectionAdmin, collectionOf, columnsWithOptionalScope, optionalFields, slugOf } from '../helpers'
import { scopeField, userField } from '../fields'
import { access } from './access'
import { hooks } from './hooks'

export function buildGrantsCollection(): CollectionConfig {
  return {
    slug: slugOf('grants'),
    labels: {
      singular: 'Achievement Grant',
      plural: 'Achievement Grants',
    },
    access: { ...access },
    hooks,
    admin: collectionAdmin({
      useAsTitle: 'title',
      defaultColumns: columnsWithOptionalScope(['title', 'user', 'completedAt', 'scope']),
      listSearchableFields: ['title'],
      description: 'What someone has earned — one row per grant. Bulk create works here.',
    }),
    fields: [
      {
        name: 'title',
        type: 'text',
        index: true,
        admin: {
          readOnly: true,
          description: 'Copied from the achievement name for lists and search.',
        },
      },
      ...optionalFields(scopeField()),
      userField(),
      {
        type: 'row',
        fields: [
          {
            name: 'achievement',
            type: 'relationship',
            relationTo: collectionOf('achievements'),
            required: true,
            index: true,
            admin: { width: '60%' },
          },
          {
            name: 'completedAt',
            type: 'date',
            required: true,
            defaultValue: () => new Date().toISOString(),
            admin: {
              width: '40%',
              date: { pickerAppearance: 'dayAndTime' },
            },
          },
        ],
      },
      {
        name: 'note',
        type: 'textarea',
        admin: { description: 'Optional note about why this was granted.' },
      },
    ],
  }
}
