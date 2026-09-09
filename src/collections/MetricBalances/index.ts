import type { CollectionConfig } from 'payload'

import {
  collectionAdmin,
  collectionOf,
  columnsWithOptionalScope,
  optionalFields,
  slugOf,
} from '../helpers.js'
import { scopeField, userField } from '../fields/index.js'
import { access } from './access/index.js'
import { hooks } from './hooks/index.js'

export function buildMetricBalancesCollection(): CollectionConfig {
  return {
    slug: slugOf('metricBalances'),
    access: { ...access },
    hooks,
    admin: collectionAdmin({
      useAsTitle: 'key',
      defaultColumns: columnsWithOptionalScope(['metric', 'user', 'value', 'scope', 'updatedAt']),
      description:
        'Stored metric totals per user (and scope). Updated by recordMetricChange; repair with reconcile. Not for computed metrics.',
    }),
    fields: [
      userField(),
      ...optionalFields(scopeField()),
      {
        name: 'metric',
        type: 'relationship',
        relationTo: collectionOf('metrics'),
        required: true,
        index: true,
      },
      {
        name: 'value',
        type: 'number',
        required: true,
        defaultValue: 0,
        index: true,
        admin: {
          description: 'Current total (sum of metric.delta changes).',
        },
      },
      {
        name: 'key',
        type: 'text',
        required: true,
        unique: true,
        index: true,
        admin: {
          readOnly: true,
          description: 'Stable unique key: user:scope:metric.',
        },
      },
    ],
  }
}
