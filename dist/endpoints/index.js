import { buildMeEndpoint } from './me';
export function buildAchievementEndpoints(options) {
    if (options.endpoints.me === false)
        return [];
    return [buildMeEndpoint(options.endpoints.me)];
}
