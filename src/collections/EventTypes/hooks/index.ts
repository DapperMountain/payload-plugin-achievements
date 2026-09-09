import type { CollectionConfig } from 'payload'

import { lockSystemCatalogFields } from '../../hooks/lockSystemCatalogFields.js'
import { preventCatalogDelete } from '../../hooks/preventCatalogDelete.js'

export const hooks: CollectionConfig['hooks'] = {
  beforeChange: [lockSystemCatalogFields],
  beforeDelete: [preventCatalogDelete({ kind: 'eventType' })],
}
