import type { CollectionAfterChangeHook } from 'payload'

import {
  didDisableRequiresReview,
  releasePendingTierReviews,
} from '../../../services/achievement/releaseReviewGate.js'

/**
 * When Requires review is turned off, approve pending tier requests and sync
 * `tier.changed` for members who already met unlock rules (including those with
 * no pending request — otherwise the UI advances with no audit until Repair).
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

  const tierId = String((doc as { id: string }).id)
  await releasePendingTierReviews({ req, tierId })
  return doc
}
