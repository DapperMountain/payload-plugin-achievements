import { didDisableRequiresReview, releasePendingTierReviews, } from '../../../services/achievement/releaseReviewGate.js';
/**
 * When Requires review is turned off, approve pending tier requests for this step
 * so each waiting user gets a tier.changed audit via existing request hooks.
 */
export const afterRequiresReviewDisabled = async ({ doc, operation, previousDoc, req, }) => {
    if (operation !== 'update')
        return doc;
    if (!didDisableRequiresReview(previousDoc, doc)) {
        return doc;
    }
    const tierId = String(doc.id);
    await releasePendingTierReviews({ req, tierId });
    return doc;
};
