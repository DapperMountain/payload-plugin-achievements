import { type SanitizedConfig } from 'payload';
import { type ReconcileProgressionArgs, type ReconcileProgressionResult } from '../services/achievement/reconcile.js';
export type ReconcileCliFilters = Omit<ReconcileProgressionArgs, 'payload' | 'req'>;
/** Parse `--user`, `--achievement`, `--tier`, `--scope`, `--limit` (ids or slugs). */
export declare function parseReconcileCliArgs(argv?: string[]): ReconcileCliFilters;
export declare function printReconcileCliHelp(): void;
/**
 * Boot Payload from the host config and repair progression.
 * Host scripts should only import config and call this (filters via argv or `filters`).
 */
export declare function runReconcileCli(args: {
    config: SanitizedConfig | Promise<SanitizedConfig>;
    argv?: string[];
    filters?: ReconcileCliFilters;
    /** When false, return the result and leave the process running. Default true. */
    exit?: boolean;
}): Promise<ReconcileProgressionResult>;
//# sourceMappingURL=reconcile.d.ts.map