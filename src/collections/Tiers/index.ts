import type { CollectionConfig } from 'payload'

import { collectionAdmin, columnsWithOptionalScope, optionalFields, slugOf } from '../helpers'
import { buildRuleTreeFields, localizedDescriptionField, localizedNameField, scopeField } from '../fields'
import { getAchievementOptions } from '../../options-store'
import { access } from './access'
import { hooks } from './hooks'

export function buildTiersCollection(): CollectionConfig {
  const mediaCollection = getAchievementOptions().mediaCollection?.trim()

  return {
    slug: slugOf('tiers'),
    access: { ...access },
    hooks,
    admin: collectionAdmin({
      useAsTitle: 'name',
      defaultColumns: columnsWithOptionalScope(['name', 'slug', 'rank', 'scope']),
      description:
        'Unlock rules decide when someone reaches this step. Current tier is derived by walking the ladder (lowest rank first) — there is no stored progress row.',
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
              description:
                'Optional icon key your app maps (e.g. Lucide names: sparkles, shield, crown, gem). Used on the rank ladder when no image is set.',
            },
          },
          ...(mediaCollection
            ? [
                {
                  name: 'image',
                  type: 'upload' as const,
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
        name: 'unlockRules',
        type: 'group',
        label: 'Unlock rules',
        admin: {
          description:
            'Rules that must pass to unlock this tier (all-of or any-of). Empty rules mean this step is open. The plugin derives current tier by walking ranks; optional tier.changed logs record moves.',
        },
        fields: buildRuleTreeFields(),
      },
    ],
  }
}
