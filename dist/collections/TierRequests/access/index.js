import { isAuthenticated, requireOne } from '../../../access/index';
import { isReviewer, isSelfUser } from '../../../access/roles/index';
export const access = {
    read: requireOne(isReviewer('tierRequests'), isSelfUser('user')),
    create: isAuthenticated,
    update: requireOne(isReviewer('tierRequests')),
    delete: requireOne(isReviewer('tierRequests')),
};
