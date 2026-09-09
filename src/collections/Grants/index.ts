import type { CollectionConfig, Field } from 'payload'

import { collectionAdmin, collectionOf, columnsWithOptionalScope, optionalFields, slugOf } from '../helpers.js'
import { scopeField, userField } from '../fields/index.js'
import { getAchievementOptions } from '../../options-store.js'
import { access } from './access/index.js'
import { hooks } from './hooks/index.js'

export function buildGrantsCollection(): CollectionConfig {
  const reconcilePath = getAchievementOptions().endpoints?.reconcile
  const apiPath =
    typeof reconcilePath === 'string' && reconcilePath.length > 0
      ? `/api${reconcilePath.startsWith('/') ? reconcilePath : `/${reconcilePath}`}`
      : null

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
      description:
        'What someone has earned — one row per grant. Creating or deleting a grant updates logs and composed progression automatically.',
      ...(apiPath
        ? {
            components: {
              beforeListTable: [
                {
                  path: '@dappermountain/payload-plugin-achievements/client#ReconcileProgressionButton',
                  clientProps: { reconcilePath: apiPath },
                },
              ],
            },
          }
        : {}),
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
      } as Field,
      {
        name: 'note',
        type: 'textarea',
        admin: { description: 'Optional note about why this was granted.' },
      },
    ],
  }
}
