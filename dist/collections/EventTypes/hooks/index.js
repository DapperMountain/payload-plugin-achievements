import { lockSystemCatalogFields } from '../../hooks/lockSystemCatalogFields';
import { preventCatalogDelete } from '../../hooks/preventCatalogDelete';
export const hooks = {
    beforeChange: [lockSystemCatalogFields],
    beforeDelete: [preventCatalogDelete({ kind: 'eventType' })],
};
