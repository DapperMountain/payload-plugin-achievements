import { isAuthenticated, requireOne } from '../../access/index';
import { isReviewer } from '../../access/roles/index';
/** Catalog / definition collections (writes gated by `canReview`). */
export function definitionAccess(collectionKey) {
    return {
        read: isAuthenticated,
        create: requireOne(isReviewer(collectionKey)),
        update: requireOne(isReviewer(collectionKey)),
        delete: requireOne(isReviewer(collectionKey)),
    };
}
