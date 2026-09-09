import type { CollectionAfterChangeHook } from 'payload'

import {
  didDisableRequiresReview,
  releasePendingTierReviews,
} from '../../../services/achievement/releaseReviewGate.js'

/**
 * When Requires review is turned off, approve pending tier requests for this step
 * so each waiting user gets a tier.changed audit via existing request hooks.
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
