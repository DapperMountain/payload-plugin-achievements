import { buildRuleTreeFields, localizedDescriptionField, localizedNameField, scopeField } from '../fields';
import { collectionAdmin, columnsWithOptionalScope, optionalFields, slugOf } from '../helpers';
import { access } from './access';
import { hooks } from './hooks';
export function buildAchievementsCollection() {
    return {
        slug: slugOf('achievements'),
        labels: {
            singular: 'Achievement Definition',
            plural: 'Achievement Definitions',
        },
        access: { ...access },
        hooks,
        admin: collectionAdmin({
            useAsTitle: 'name',
            defaultColumns: columnsWithOptionalScope(['name', 'slug', 'requiresReview', 'scope']),
            description: 'What someone can earn. Set who’s eligible and whether a person on your team needs to approve it.',
        }),
        fields: [
            ...optionalFields(scopeField()),
            {
                type: 'row',
                fields: [
                    localizedNameField({ width: '50%' }),
                    {
                        name: 'slug',
                        type: 'text',
                        required: true,
                        unique: true,
                        index: true,
                        admin: { width: '50%' },
                    },
                ],
            },
            localizedDescriptionField(),
            {
                name: 'requiresReview',
                type: 'checkbox',
                defaultValue: true,
                label: 'Requires review',
                admin: {
                    description: 'When turned off, any pending requests for this achievement are approved automatically (one user at a time via existing grant hooks).',
                },
            },
            {
                name: 'eligibilityRules',
                type: 'group',
                label: 'Eligibility rules',
                admin: {
                    description: 'Who may request this achievement. Composed parents that auto-grant should leave this empty.',
                },
                fields: buildRuleTreeFields(),
            },
            {
                name: 'completionRules',
                type: 'group',
                label: 'Completion rules',
                admin: {
                    description: 'What this achievement is made of. When every rule passes, it is granted automatically (do not require review on composed parents). Nested achievements appear in this order in your app UI.',
                },
                fields: buildRuleTreeFields(),
            },
        ],
    };
}
