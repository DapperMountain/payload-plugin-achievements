import { getPayload } from 'payload';
import { reconcileProgression, } from '../services/achievement/reconcile.js';
function readFlag(argv, names) {
    for (const name of names) {
        const prefix = `${name}=`;
        for (const arg of argv) {
            if (arg === name) {
                const idx = argv.indexOf(arg);
                const next = argv[idx + 1];
                if (next && !next.startsWith('-'))
                    return next;
            }
            if (arg.startsWith(prefix)) {
                const value = arg.slice(prefix.length);
                if (value)
                    return value;
            }
        }
    }
    return undefined;
}
function readLimit(argv) {
    const raw = readFlag(argv, ['--limit', '-n']);
    if (!raw)
        return undefined;
    const n = Number(raw);
    return Number.isFinite(n) ? Math.floor(n) : undefined;
}
/** Parse `--user`, `--achievement`, `--tier`, `--scope`, `--limit` (ids or slugs). */
export function parseReconcileCliArgs(argv = process.argv.slice(2)) {
    return {
        userId: readFlag(argv, ['--user', '--userId']),
        scopeId: readFlag(argv, ['--scope', '--scopeId']) ?? null,
        achievementId: readFlag(argv, ['--achievementId']),
        achievementSlug: readFlag(argv, ['--achievement', '--achievementSlug']),
        tierId: readFlag(argv, ['--tierId']),
        tierSlug: readFlag(argv, ['--tier', '--tierSlug']),
        limit: readLimit(argv),
    };
}
export function printReconcileCliHelp() {
    // eslint-disable-next-line no-console -- CLI help
    console.log(`Usage: achievements reconcile [options]

Options:
  --user, --userId <id>
  --scope, --scopeId <id>
  --achievement, --achievementSlug <slug>
  --achievementId <id>
  --tier, --tierSlug <slug>
  --tierId <id>
  --limit, -n <number>
  --help, -h
`);
}
/**
 * Boot Payload from the host config and repair progression.
 * Host scripts should only import config and call this (filters via argv or `filters`).
 */
export async function runReconcileCli(args) {
    const argv = args.argv ?? process.argv.slice(2);
    if (argv.includes('--help') || argv.includes('-h')) {
        printReconcileCliHelp();
        if (args.exit !== false)
            process.exit(0);
        return {
            usersScanned: 0,
            grantedLogsBackfilled: 0,
            compositesGranted: 0,
            achievementRequestsEnsured: 0,
            tierRequestsEnsured: 0,
            tierLogsWritten: 0,
            metricBalancesRebuilt: 0,
        };
    }
    const filters = args.filters ?? parseReconcileCliArgs(argv);
    const payload = await getPayload({ config: args.config });
    try {
        const result = await reconcileProgression({ payload, ...filters });
        payload.logger.info({ msg: 'achievements reconcile complete', ...filters, ...result });
        if (args.exit !== false)
            process.exit(0);
        return result;
    }
    catch (error) {
        payload.logger.error({ err: error, msg: 'achievements reconcile failed' });
        if (args.exit !== false)
            process.exit(1);
        throw error;
    }
}
