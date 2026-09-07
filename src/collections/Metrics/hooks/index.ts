import type { CollectionConfig } from 'payload'

import { lockSystemCatalogFields } from '../../hooks/lockSystemCatalogFields'
import { preventCatalogDelete } from '../../hooks/preventCatalogDelete'

export const hooks: CollectionConfig['hooks'] = {
  beforeChange: [lockSystemCatalogFields],
  beforeDelete: [preventCatalogDelete({ kind: 'metric' })],
}
