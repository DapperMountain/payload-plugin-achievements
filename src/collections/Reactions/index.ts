import type { CollectionConfig, Field } from 'payload'

import { actionSelectOptions, BUILTIN_GRANT_ACTION, getHostActions } from '../../extensions/actions.js'
import { catalogFilterOptions } from '../fields/catalogFilter.js'
import { whenSiblingEquals } from '../fields/whenSibling.js'
import { collectionAdmin, collectionOf, columnsWithOptionalScope, optionalFields, slugOf } from '../helpers.js'
import { scopeField } from '../fields/index.js'
import { access } from './access/index.js'

function hostActionParamFields(): Field[] {
  const fields: Field[] = []
  for (const action of getHostActions()) {
    for (const field of action.fields ?? []) {
      fields.push(whenSiblingEquals(field, 'action', action.type))
    }
  }
  return fields
}

export function buildReactionsCollection(): CollectionConfig {
  return {
    slug: slugOf('reactions'),
    labels: {
      singular: 'Achievement Reaction',
      plural: 'Achievement Reactions',
    },
    access: { ...access },
    admin: collectionAdmin({
      useAsTitle: 'name',
      defaultColumns: columnsWithOptionalScope(['name', 'trigger', 'action', 'enabled', 'scope']),
      description:
        'When an event is logged or an achievement is granted/revoked, run a set-based action. Re-running is safe — there is no run-history table.',
    }),
    fields: [
      ...optionalFields(scopeField()),
      {
        name: 'name',
        type: 'text',
        required: true,
        index: true,
        admin: { description: 'Admin label for this reaction.' },
      },
      {
        name: 'enabled',
        type: 'checkbox',
        defaultValue: true,
        admin: { description: 'Turn off to keep the row without running it.' },
      },
      {
        name: 'trigger',
        type: 'select',
        required: true,
        options: [
          { label: 'Event logged', value: 'event' },
          { label: 'Achievement granted', value: 'achievement.granted' },
          { label: 'Achievement revoked', value: 'achievement.revoked' },
        ],
        admin: {
          description:
            'Grant/revoke triggers fire from the grant row. Use “Event logged” for host event types (not achievement.granted / achievement.revoked — those already cascade from grants).',
        },
      },
      {
        name: 'eventType',
        type: 'relationship',
        relationTo: collectionOf('eventTypes'),
        filterOptions: catalogFilterOptions,
        admin: {
          condition: (_, sibling) => sibling?.trigger === 'event',
          description: 'Which log type starts this reaction.',
        },
      },
      {
        name: 'achievement',
        type: 'relationship',
        relationTo: collectionOf('achievements'),
        filterOptions: catalogFilterOptions,
        admin: {
          condition: (_, sibling) =>
            sibling?.trigger === 'achievement.granted' || sibling?.trigger === 'achievement.revoked',
          description: 'Which achievement grant/revoke starts this reaction.',
        },
      },
      {
        name: 'action',
        type: 'select',
        required: true,
        options: actionSelectOptions(),
        admin: { description: 'Set-based command to run. Hosts register extra actions in plugin options.' },
      },
      {
        name: 'targetAchievement',
        type: 'relationship',
        relationTo: collectionOf('achievements'),
        filterOptions: catalogFilterOptions,
        admin: {
          condition: (_, sibling) => sibling?.action === BUILTIN_GRANT_ACTION,
          description: 'Achievement to grant (no-ops if they already have it).',
        },
      },
      ...hostActionParamFields(),
    ],
  }
}
