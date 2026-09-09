import type { CollectionAfterChangeHook } from 'payload'

import {
  didDisableRequiresReview,
  releasePendingAchievementReviews,
} from '../../../services/achievement/releaseReviewGate.js'

/**
 * When Requires review is turned off, approve pending requests for this achievement
 * so each waiting user is granted via existing request hooks.
 */
export const afterRequiresReviewDisabled: CollectionAfterChangeHook = async ({
  doc,
  operation,
  previousDoc,
  req,
}) => {
  if (operation !== 'update') return doc
  if (
    !didDisableRequiresReview(
      previousDoc as { requiresReview?: boolean | null } | undefined,
      doc as { requiresReview?: boolean | null },
    )
  ) {
    return doc
  }

  const achievementId = String((doc as { id: string }).id)
  await releasePendingAchievementReviews({ req, achievementId })
  return doc
}
