import { isAuthenticated, requireOne } from '../../../access/index';
import { isReviewer, isSelfUser } from '../../../access/roles/index';
export const access = {
    read: requireOne(isReviewer('achievementRequests'), isSelfUser('user')),
    create: isAuthenticated,
    update: requireOne(isReviewer('achievementRequests')),
    delete: requireOne(isReviewer('achievementRequests')),
};
