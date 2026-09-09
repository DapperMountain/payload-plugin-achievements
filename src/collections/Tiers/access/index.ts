import type { CollectionConfig } from 'payload'

import { definitionAccess } from '../../access/definitions.js'

export const access: NonNullable<CollectionConfig['access']> = definitionAccess('tiers')
