import { lockSystemCatalogFields } from '../../hooks/lockSystemCatalogFields.js';
import { preventCatalogDelete } from '../../hooks/preventCatalogDelete.js';
export const hooks = {
    beforeChange: [lockSystemCatalogFields],
    beforeDelete: [preventCatalogDelete({ kind: 'eventType' })],
};
