import { collectionAdmin, collectionOf, columnsWithOptionalScope, optionalFields, slugOf } from '../helpers.js';
import { localizedNameField, scopeField } from '../fields/index.js';
import { catalogFilterOptions } from '../fields/catalogFilter.js';
import { elapsedSinceSelectOptions } from '../../extensions/elapsedSinceOptions.js';
import { access } from './access/index.js';
import { hooks } from './hooks/index.js';
export function buildMetricsCollection() {
    return {
        slug: slugOf('metrics'),
        access: { ...access },
        hooks,
        admin: collectionAdmin({
            useAsTitle: 'name',
            defaultColumns: columnsWithOptionalScope(['name', 'slug', 'kind', 'system', 'scope']),
            description: 'Named numbers. Stored metrics are score totals from log deltas; computed metrics are derived at evaluation time.',
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
                name: 'kind',
                type: 'select',
                required: true,
                defaultValue: 'stored',
                enumName: 'ach_metric_kind',
                options: [
                    { label: 'Stored (log deltas)', value: 'stored' },
                    { label: 'Computed', value: 'computed' },
                ],
                admin: {
                    description: 'Stored = sum of metric.delta logs (via balances). Computed = derived value.',
                },
            },
            {
                name: 'compute',
                type: 'select',
                defaultValue: 'elapsed',
                enumName: 'ach_metric_compute',
                options: [{ label: 'Elapsed time', value: 'elapsed' }],
                admin: {
                    condition: (_, sibling) => sibling?.kind === 'computed',
                    description: 'How this number is derived.',
                },
            },
            {
                name: 'unit',
                type: 'select',
                defaultValue: 'days',
                enumName: 'ach_metric_unit',
                options: [
                    { label: 'Seconds', value: 'seconds' },
                    { label: 'Minutes', value: 'minutes' },
                    { label: 'Hours', value: 'hours' },
                    { label: 'Days', value: 'days' },
                    { label: 'Years', value: 'years' },
                ],
                admin: {
                    condition: (_, sibling) => sibling?.kind === 'computed' && sibling?.compute === 'elapsed',
                    description: 'Unit of the exposed number (whole units since the anchor). Years use a fixed 365-day length.',
                },
            },
            {
                name: 'since',
                type: 'select',
                defaultValue: 'user-created-at',
                enumName: 'ach_metric_since',
                options: elapsedSinceSelectOptions(),
                admin: {
                    condition: (_, sibling) => sibling?.kind === 'computed' && sibling?.compute === 'elapsed',
                    description: 'Which timestamp starts the clock.',
                },
            },
            {
                name: 'eventType',
                type: 'relationship',
                relationTo: collectionOf('eventTypes'),
                filterOptions: catalogFilterOptions,
                admin: {
                    condition: (_, sibling) => sibling?.kind === 'computed' &&
                        sibling?.compute === 'elapsed' &&
                        sibling?.since === 'first-event',
                    description: 'Event type whose first log starts the clock.',
                },
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
    };
}
