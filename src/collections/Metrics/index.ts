import type { CollectionConfig } from 'payload'

import { collectionAdmin, columnsWithOptionalScope, optionalFields, slugOf } from '../helpers.js'
import { localizedNameField, scopeField } from '../fields/index.js'
import { access } from './access/index.js'
import { hooks } from './hooks/index.js'

export function buildMetricsCollection(): CollectionConfig {
  return {
    slug: slugOf('metrics'),
    access: { ...access },
    hooks,
    admin: collectionAdmin({
      useAsTitle: 'name',
      defaultColumns: columnsWithOptionalScope(['name', 'slug', 'system', 'scope']),
      description: 'Scores and totals you track for someone — like points or a streak.',
    }),
    fields: [
      ...optionalFields(scopeField()),
      {
        type: 'row',
        fields: [
          localizedNameField({ width: '50%' }),
          { name: 'slug', type: 'text', required: true, unique: true, index: true, admin: { width: '50%' } },
        ],
      },
      {
        name: 'system',
        type: 'checkbox',
        defaultValue: false,
        admin: {
          readOnly: true,
          description: 'Built-in metric. It can’t be deleted.',
        },
      },
    ],
  }
}
