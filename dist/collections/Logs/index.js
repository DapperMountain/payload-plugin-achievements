import { catalogFilterOptions } from '../fields/catalogFilter';
import { collectionAdmin, collectionOf, optionalFields, slugOf } from '../helpers';
import { getAchievementOptions } from '../../options-store';
import { scopeField, userField } from '../fields';
import { access } from './access';
import { validateActor, validateChange, validateMetric } from './fields/validators';
import { hooks } from './hooks';
/** Append-only occurrence log. `type` / `metric` are catalog relationships. */
export function buildLogsCollection() {
    const users = getAchievementOptions().usersCollectionSlug ?? 'users';
    const eventTypesSlug = collectionOf('eventTypes');
    return {
        slug: slugOf('logs'),
        labels: {
            singular: 'Achievement Log',
            plural: 'Achievement Logs',
        },
        access: { ...access },
        hooks,
        admin: collectionAdmin({
            useAsTitle: 'id',
            defaultColumns: ['type', 'user', 'actor', 'metric', 'change', 'createdAt'],
            description: 'Member activity history — grants, revokes, score changes, tier moves, and host custom events. Not a second grant store.',
        }),
        fields: [
            ...optionalFields(scopeField()),
            userField(),
            {
                type: 'row',
                fields: [
                    {
                        name: 'type',
                        type: 'relationship',
                        relationTo: collectionOf('eventTypes'),
                        required: true,
                        index: true,
                        filterOptions: catalogFilterOptions,
                        admin: { width: '50%', description: 'What kind of thing happened.' },
                    },
                    {
                        name: 'actor',
                        type: 'relationship',
                        relationTo: users,
                        index: true,
                        validate: validateActor,
                        admin: {
                            width: '50%',
                            description: 'Who caused it.',
                            components: {
                                Field: {
                                    path: '@dappermountain/payload-plugin-achievements/client#ActorField',
                                    clientProps: { eventTypesSlug },
                                },
                            },
                        },
                    },
                    {
                        name: 'metric',
                        type: 'relationship',
                        relationTo: collectionOf('metrics'),
                        filterOptions: catalogFilterOptions,
                        validate: validateMetric,
                        admin: {
                            width: '50%',
                            description: 'Which score moved.',
                            components: {
                                Field: {
                                    path: '@dappermountain/payload-plugin-achievements/client#MetricField',
                                    clientProps: { eventTypesSlug },
                                },
                            },
                        },
                    },
                    {
                        name: 'change',
                        type: 'number',
                        validate: validateChange,
                        admin: {
                            width: '50%',
                            description: 'How much it changed (for example 10 or −3).',
                            components: {
                                Field: {
                                    path: '@dappermountain/payload-plugin-achievements/client#MetricChangeField',
                                    clientProps: { eventTypesSlug },
                                },
                            },
                        },
                    },
                ],
            },
            {
                type: 'collapsible',
                label: 'Details',
                admin: {
                    initCollapsed: true,
                    description: 'Extra detail if you need it.',
                },
                fields: [
                    {
                        name: 'reason',
                        type: 'text',
                        admin: { description: 'A short note about why this was recorded.' },
                    },
                    {
                        name: 'data',
                        type: 'json',
                        admin: {
                            description: 'Engine transition envelope: `{ from, to }` each `{ id, slug? }` or null (tier.changed, achievement.granted/revoked). Hosts may add extra keys.',
                        },
                    },
                ],
            },
        ],
    };
}
