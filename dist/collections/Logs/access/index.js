import { requireOne } from '../../../access/index';
import { isReviewer, isSelfUser } from '../../../access/roles/index';
export const access = {
    read: requireOne(isReviewer('logs'), isSelfUser('user')),
    create: requireOne(isReviewer('logs')),
    update: requireOne(isReviewer('logs')),
    delete: requireOne(isReviewer('logs')),
};
