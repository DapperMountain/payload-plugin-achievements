import { requireOne } from '../../../access/index';
import { isReviewer, isSelfUser } from '../../../access/roles/index';
export const access = {
    read: requireOne(isReviewer('grants'), isSelfUser('user')),
    create: requireOne(isReviewer('grants')),
    update: requireOne(isReviewer('grants')),
    delete: requireOne(isReviewer('grants')),
};
