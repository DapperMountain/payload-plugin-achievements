import { collectionAdmin, collectionOf, columnsWithOptionalScope, optionalFields, slugOf } from '../helpers.js';
import { localizedNameField, scopeField } from '../fields/index.js';
import { access } from './access/index.js';
import { hooks } from './hooks/index.js';
export function buildEventTypesCollection() {
    return {
        slug: slugOf('eventTypes'),
        access: { ...access },
        hooks,
        admin: collectionAdmin({
            useAsTitle: 'name',
            defaultColumns: columnsWithOptionalScope([
                'name',
                'slug',
                'requiresActor',
                'requiresMetric',
                'system',
                'scope',
            ]),
            description: 'Names for things that can happen and show up in the achievement logs.',
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
                name: 'requiresActor',
                type: 'checkbox',
                defaultValue: false,
                label: 'Requires an actor',
                admin: {
                    description: 'Turn this on when someone else caused the entry (for example a peer nomination). We’ll ask for that person when it’s logged.',
                },
            },
            {
                name: 'requiresMetric',
                type: 'checkbox',
                defaultValue: false,
                label: 'Adjusts a metric',
                admin: {
                    description: 'Turn this on when the entry changes a score (like points). We’ll ask which metric and by how much.',
                },
            },
            {
                name: 'system',
                type: 'checkbox',
                defaultValue: false,
                admin: {
                    readOnly: true,
                    description: 'Built-in type. It can’t be deleted.',
                },
            },
            {
                name: 'logs',
                type: 'join',
                collection: collectionOf('logs'),
                on: 'type',
                admin: { allowCreate: false, defaultColumns: ['user', 'createdAt'] },
            },
        ],
    };
}
