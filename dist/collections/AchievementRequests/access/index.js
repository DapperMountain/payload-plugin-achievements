import { isAuthenticated, requireOne } from '../../../access/index.js';
import { isReviewer, isSelfUser } from '../../../access/roles/index.js';
export const access = {
    read: requireOne(isReviewer('achievementRequests'), isSelfUser('user')),
    create: isAuthenticated,
    update: requireOne(isReviewer('achievementRequests')),
    delete: requireOne(isReviewer('achievementRequests')),
};
