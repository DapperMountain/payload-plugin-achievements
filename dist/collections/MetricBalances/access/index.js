import { requireOne } from '../../../access/index.js';
import { isReviewer } from '../../../access/roles/index.js';
/** Projection rows — writes only via trusted helpers (`overrideAccess`). */
export const access = {
    read: requireOne(isReviewer('metricBalances')),
    create: () => false,
    update: () => false,
    delete: requireOne(isReviewer('metricBalances')),
};
