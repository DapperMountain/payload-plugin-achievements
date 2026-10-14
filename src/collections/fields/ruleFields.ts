import type { Field, Option } from 'payload'

import { getHostRuleTypeAdminEntries } from '../../extensions/registry.js'
import { catalogFilterOptions } from './catalogFilter.js'
import { collectionOf } from '../helpers.js'
import { whenSiblingEquals } from './whenSibling.js'

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

function hostRuleTypeOptions(): Option[] {
  return getHostRuleTypeAdminEntries().map((rule) => ({
    label: rule.label ?? rule.type,
    value: rule.type,
  }))
}

function hostRuleParamFields(): Field[] {
  const fields: Field[] = []
  for (const rule of getHostRuleTypeAdminEntries()) {
    for (const field of rule.fields ?? []) {
      fields.push(whenSiblingEquals(field, 'type', rule.type))
    }
  }
  return fields
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
      ...hostRuleTypeOptions(),
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
    {
      name: 'actorTier',
      type: 'relationship',
      relationTo: collectionOf('tiers'),
      filterOptions: catalogFilterOptions,
      admin: {
        condition: (_, sibling) => sibling?.type === 'event-count',
        description:
          'Only count events whose actor held at least this tier in this scope when the event was written. Requires the event type to snapshot actor tiers. Leave empty to count every matching event.',
      },
    },
    ...hostRuleParamFields(),
  ]
}

function buildRuleLeafFields(): Field[] {
  return [ruleTypeSelect(false), ...ruleParamFields()]
}

/**
 * Postgres truncates identifiers over 63 chars. Nested `rules` arrays under
 * `eligibilityRules` / `completionRules` / `unlockRules` exceed that when
 * Payload auto-names tables — set explicit short `dbName` values instead.
 *
 * Call sites must pass a **unique** `dbName` (plugin-wide). Nested group rules
 * use `${dbName}_g` so one prefix yields two unique table names.
 */
export const POSTGRES_IDENTIFIER_MAX = 63

/** Longest default plugin table (`achievement-definitions` → snake_case). */
const LONGEST_DEFAULT_PARENT_TABLE = 'achievement_definitions'

const PARENT_ID_INDEX_SUFFIX = '_parent_id_idx'

/** Nested group-rules array suffix; keep short and stable. */
const NESTED_RULES_DB_SUFFIX = '_g'

export type BuildRuleTreeFieldsArgs = {
  /**
   * Short, unique Postgres table name for the outer `rules` array.
   * Nested group `rules` become `${dbName}_g`. Must stay unique across the plugin.
   */
  dbName: string
}

/**
 * Worst-case identifier length when Payload prefixes `dbName` with the parent
 * collection table and appends `_parent_id_idx` / `_parent_id_fk`.
 */
export function ruleArrayIdentifierLength(dbName: string, parentTable = LONGEST_DEFAULT_PARENT_TABLE): number {
  return parentTable.length + 1 + dbName.length + PARENT_ID_INDEX_SUFFIX.length
}

export function assertSafeRuleArrayDbName(dbName: string): void {
  if (!/^[a-z][a-z0-9_]*$/.test(dbName)) {
    throw new Error(
      `Rule array dbName "${dbName}" must be a lowercase snake_case Postgres identifier starting with a letter.`,
    )
  }
  const length = ruleArrayIdentifierLength(dbName)
  if (length > POSTGRES_IDENTIFIER_MAX) {
    throw new Error(
      `Rule array dbName "${dbName}" is too long (${length} > ${POSTGRES_IDENTIFIER_MAX} with parent index suffix).`,
    )
  }
}

/**
 * Top-level rule group: combinator + rules, with one nested group level.
 * Pass a unique short {@link BuildRuleTreeFieldsArgs.dbName} per embed site.
 */
export function buildRuleTreeFields(args: BuildRuleTreeFieldsArgs): Field[] {
  assertSafeRuleArrayDbName(args.dbName)
  const nestedDbName = `${args.dbName}${NESTED_RULES_DB_SUFFIX}`
  assertSafeRuleArrayDbName(nestedDbName)

  return [
    combinatorField(),
    {
      name: 'rules',
      type: 'array',
      dbName: args.dbName,
      labels: { singular: 'Rule', plural: 'Rules' },
      fields: [
        ruleTypeSelect(true),
        ...ruleParamFields(),
        combinatorField(true),
        {
          name: 'rules',
          type: 'array',
          dbName: nestedDbName,
          labels: { singular: 'Rule', plural: 'Rules' },
          admin: { condition: (_, sibling) => sibling?.type === 'group' },
          fields: buildRuleLeafFields(),
        },
      ],
    },
  ]
}

/** @deprecated Use {@link buildRuleTreeFields}. */
export function buildRuleRowFields(args: BuildRuleTreeFieldsArgs): Field[] {
  return buildRuleTreeFields(args)
}
