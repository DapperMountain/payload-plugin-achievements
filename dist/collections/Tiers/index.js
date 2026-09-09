import { collectionAdmin, columnsWithOptionalScope, optionalFields, slugOf } from '../helpers.js';
import { buildRuleTreeFields, localizedDescriptionField, localizedNameField, scopeField } from '../fields/index.js';
import { getAchievementOptions } from '../../options-store.js';
import { access } from './access/index.js';
import { hooks } from './hooks/index.js';
export function buildTiersCollection() {
    const mediaCollection = getAchievementOptions().mediaCollection?.trim();
    return {
        slug: slugOf('tiers'),
        access: { ...access },
        hooks,
        admin: collectionAdmin({
            useAsTitle: 'name',
            defaultColumns: columnsWithOptionalScope(['name', 'slug', 'rank', 'requiresReview', 'scope']),
            description: 'Unlock rules decide when someone reaches this step. Current tier is derived by walking the ladder (lowest rank first). Tiers with Requires review also need an approved tier request.',
        }),
        fields: [
            ...optionalFields(scopeField()),
            {
                type: 'row',
                fields: [
                    localizedNameField({ width: '40%' }),
                    {
                        name: 'slug',
                        type: 'text',
                        required: true,
                        unique: true,
                        index: true,
                        admin: { width: '35%' },
                    },
                    {
                        name: 'rank',
                        type: 'number',
                        required: true,
                        defaultValue: 0,
                        admin: {
                            width: '25%',
                            description: 'Lower numbers are earlier on the ladder (0 is the first step).',
                        },
                    },
                ],
            },
            localizedDescriptionField(),
            {
                type: 'row',
                fields: [
                    {
                        name: 'icon',
                        type: 'text',
                        admin: {
                            width: mediaCollection ? '50%' : '100%',
                            description: 'Optional icon key your app maps (e.g. Lucide names: sparkles, shield, crown, gem). Used on the rank ladder when no image is set.',
                        },
                    },
                    ...(mediaCollection
                        ? [
                            {
                                name: 'image',
                                type: 'upload',
                                relationTo: mediaCollection,
                                admin: {
                                    width: '50%',
                                    description: 'Optional badge image. Wins over icon when both are set.',
                                },
                            },
                        ]
                        : []),
                ],
            },
            {
                name: 'requiresReview',
                type: 'checkbox',
                defaultValue: false,
                admin: {
                    description: 'When enabled, unlock rules alone are not enough — an approved tier request is required before this step becomes the member’s current tier. Turning it off approves pending requests for this tier automatically.',
                },
            },
            {
                name: 'unlockRules',
                type: 'group',
                label: 'Unlock rules',
                admin: {
                    description: 'Rules that must pass to unlock this tier (all-of or any-of). Empty rules mean this step is open. Current tier is derived by walking ranks; optional tier.changed logs record moves.',
                },
                fields: buildRuleTreeFields(),
            },
        ],
    };
}
