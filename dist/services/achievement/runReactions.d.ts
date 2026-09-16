import type { PayloadRequest, Where } from 'payload';
import type { AchievementReactionTrigger } from '../../types.js';
export type RunReactionsArgs = {
    req: PayloadRequest;
    trigger: AchievementReactionTrigger;
    userId: string;
    scopeId: string | null;
    eventTypeId?: string | null;
    eventTypeSlug?: string | null;
    achievementId?: string | null;
    log?: Record<string, unknown> | null;
};
export declare function reactionMatchWhere(args: {
    trigger: AchievementReactionTrigger;
    scopeId: string | null;
    eventTypeId?: string | null;
    achievementId?: string | null;
}): Where | null;
export declare function runReactions(args: RunReactionsArgs): Promise<number>;
//# sourceMappingURL=runReactions.d.ts.map