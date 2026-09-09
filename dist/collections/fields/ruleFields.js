import { catalogFilterOptions } from './catalogFilter.js';
import { collectionOf } from '../helpers.js';
import { elapsedSinceSelectOptions } from '../../extensions/elapsedSinceOptions.js';
function combinatorField(visibleWhenGroup) {
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
            ? { admin: { condition: (_, sibling) => sibling?.type === 'group' } }
            : {}),
    };
}
function ruleTypeSelect(includeGroup) {
    return {
        name: 'type',
        type: 'select',
        required: true,
        options: [
            { label: 'Tier at least', value: 'tier-at-least' },
            { label: 'Achievement complete', value: 'achievement-complete' },
            { label: 'Metric minimum', value: 'metric-minimum' },
            { label: 'Event count', value: 'event-count' },
            { label: 'Elapsed since', value: 'elapsed-since' },
            ...(includeGroup ? [{ label: 'Group', value: 'group' }] : []),
        ],
    };
}
function ruleParamFields() {
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
                condition: (_, sibling) => sibling?.type === 'event-count' ||
                    (sibling?.type === 'elapsed-since' && sibling?.since === 'first-event'),
                description: 'Event type to count, or (for elapsed since) the type whose first log starts the clock.',
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
            name: 'since',
            type: 'select',
            // Nested under eligibility/completion/unlock → rules → rules; keep PG enum ≤63 chars.
            enumName: 'ach_elapsed_since',
            defaultValue: 'user-created-at',
            options: elapsedSinceSelectOptions(),
            admin: {
                condition: (_, sibling) => sibling?.type === 'elapsed-since',
                description: 'Which timestamp starts the clock.',
            },
        },
        {
            type: 'row',
            admin: {
                condition: (_, sibling) => sibling?.type === 'elapsed-since',
            },
            fields: [
                {
                    name: 'amount',
                    type: 'number',
                    admin: {
                        width: '50%',
                        description: 'How much time must pass.',
                    },
                },
                {
                    name: 'unit',
                    type: 'select',
                    enumName: 'ach_elapsed_unit',
                    defaultValue: 'days',
                    options: [
                        { label: 'Days', value: 'days' },
                        { label: 'Hours', value: 'hours' },
                        { label: 'Minutes', value: 'minutes' },
                    ],
                    admin: {
                        width: '50%',
                        description: 'Unit for the amount.',
                    },
                },
            ],
        },
    ];
}
function buildRuleLeafFields() {
    return [ruleTypeSelect(false), ...ruleParamFields()];
}
/**
 * Top-level rule group: combinator + rules, with one nested group level.
 */
export function buildRuleTreeFields() {
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
    ];
}
/** @deprecated Use {@link buildRuleTreeFields}. */
export function buildRuleRowFields() {
    return buildRuleTreeFields();
}
