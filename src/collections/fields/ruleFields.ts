import type { Field } from 'payload'

import { catalogFilterOptions } from './catalogFilter.js'
import { collectionOf } from '../helpers.js'

function combinatorField(visibleWhenGroup?: boolean): Field {
  return {
    name: 'combinator',
    type: 'select',
    required: true,
    defaultValue: 'and',
    options: [
      { label: 'All of these', value: 'and' },
      { label: 'Any of these', value: 'or' },
    ],
    ...(visibleWhenGroup
      ? { admin: { condition: (_: unknown, sibling: { type?: string }) => sibling?.type === 'group' } }
      : {}),
  }
}

function ruleTypeSelect(includeGroup: boolean): Field {
  return {
    name: 'type',
    type: 'select',
    required: true,
    options: [
      { label: 'Tier at least', value: 'tier-at-least' },
      { label: 'Achievement complete', value: 'achievement-complete' },
      { label: 'Metric minimum', value: 'metric-minimum' },
      { label: 'Event count', value: 'event-count' },
      ...(includeGroup ? [{ label: 'Group', value: 'group' }] : []),
    ],
  }
}

function ruleParamFields(): Field[] {
  return [
    {
      name: 'tier',
      type: 'relationship',
      relationTo: collectionOf('tiers'),
      filterOptions: catalogFilterOptions,
      admin: {
        condition: (_, sibling) => sibling?.type === 'tier-at-least',
        description: 'They must be at least this tier.',
      },
    },
    {
      name: 'achievement',
      type: 'relationship',
      relationTo: collectionOf('achievements'),
      filterOptions: catalogFilterOptions,
      admin: {
        condition: (_, sibling) => sibling?.type === 'achievement-complete',
        description: 'They must already have this achievement.',
      },
    },
    {
      name: 'metric',
      type: 'relationship',
      relationTo: collectionOf('metrics'),
      filterOptions: catalogFilterOptions,
      admin: {
        condition: (_, sibling) => sibling?.type === 'metric-minimum',
        description: 'Which score to check.',
      },
    },
    {
      name: 'minimum',
      type: 'number',
      admin: {
        condition: (_, sibling) => sibling?.type === 'metric-minimum',
        description: 'They need at least this much.',
      },
    },
    {
      name: 'eventType',
      type: 'relationship',
      relationTo: collectionOf('eventTypes'),
      filterOptions: catalogFilterOptions,
      admin: {
        condition: (_, sibling) => sibling?.type === 'event-count',
        description: 'Event type to count.',
      },
    },
    {
      name: 'count',
      type: 'number',
      admin: {
        condition: (_, sibling) => sibling?.type === 'event-count',
        description: 'How many times it needs to have happened.',
      },
    },
  ]
}

function buildRuleLeafFields(): Field[] {
  return [ruleTypeSelect(false), ...ruleParamFields()]
}

/**
 * Top-level rule group: combinator + rules, with one nested group level.
 */
export function buildRuleTreeFields(): Field[] {
  return [
    combinatorField(),
    {
      name: 'rules',
      type: 'array',
      labels: { singular: 'Rule', plural: 'Rules' },
      fields: [
        ruleTypeSelect(true),
        ...ruleParamFields(),
        combinatorField(true),
        {
          name: 'rules',
          type: 'array',
          labels: { singular: 'Rule', plural: 'Rules' },
          admin: { condition: (_, sibling) => sibling?.type === 'group' },
          fields: buildRuleLeafFields(),
        },
      ],
    },
  ]
}

/** @deprecated Use {@link buildRuleTreeFields}. */
export function buildRuleRowFields(): Field[] {
  return buildRuleTreeFields()
}
