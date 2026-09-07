import type { CollectionConfig } from 'payload'

import { definitionAccess } from '../../access/definitions'

export const access: NonNullable<CollectionConfig['access']> = definitionAccess('achievements')
