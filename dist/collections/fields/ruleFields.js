import { getHostRuleTypeAdminEntries } from '../../extensions/registry.js';
import { catalogFilterOptions } from './catalogFilter.js';
import { collectionOf } from '../helpers.js';
import { whenSiblingEquals } from './whenSibling.js';
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
function hostRuleTypeOptions() {
    return getHostRuleTypeAdminEntries().map((rule) => ({
        label: rule.label ?? rule.type,
        value: rule.type,
    }));
}
function hostRuleParamFields() {
    const fields = [];
    for (const rule of getHostRuleTypeAdminEntries()) {
        for (const field of rule.fields ?? []) {
            fields.push(whenSiblingEquals(field, 'type', rule.type));
        }
    }
    return fields;
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
            ...hostRuleTypeOptions(),
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
                description: 'Only count events whose actor held at least this tier in this scope when the event was written. Requires the event type to snapshot actor tiers. Leave empty to count every matching event.',
            },
        },
        ...hostRuleParamFields(),
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
