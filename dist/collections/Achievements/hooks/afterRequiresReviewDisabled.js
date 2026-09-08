import { didDisableRequiresReview, releasePendingAchievementReviews, } from '../../../services/achievement/releaseReviewGate';
/**
 * When Requires review is turned off, approve pending requests for this achievement
 * so each waiting user is granted via existing request hooks.
 */
export const afterRequiresReviewDisabled = async ({ doc, operation, previousDoc, req, }) => {
    if (operation !== 'update')
        return doc;
    if (!didDisableRequiresReview(previousDoc, doc)) {
        return doc;
    }
    const achievementId = String(doc.id);
    await releasePendingAchievementReviews({ req, achievementId });
    return doc;
};
