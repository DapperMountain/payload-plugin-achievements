import { buildMeEndpoint } from './me';
import { buildReconcileEndpoint } from './reconcile';
export function buildAchievementEndpoints(options) {
    const endpoints = [];
    if (options.endpoints.me !== false) {
        endpoints.push(buildMeEndpoint(options.endpoints.me));
    }
    if (options.endpoints.reconcile !== false) {
        endpoints.push(buildReconcileEndpoint(options.endpoints.reconcile));
    }
    return endpoints;
}
