import { didDisableRequiresReview, releasePendingTierReviews, } from '../../../services/achievement/releaseReviewGate.js';
/**
 * When Requires review is turned off, approve pending tier requests and sync
 * `tier.changed` for members who already met unlock rules (including those with
 * no pending request — otherwise the UI advances with no audit until Repair).
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
