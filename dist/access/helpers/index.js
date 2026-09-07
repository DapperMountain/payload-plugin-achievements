export const allowAll = () => true;
export const denyAll = () => false;
export function requireOne(...fns) {
    return async (args) => {
        for (const fn of fns) {
            const result = await fn(args);
            if (result === true)
                return true;
            if (result && typeof result === 'object')
                return result;
        }
        return false;
    };
}
export function getUserId(req) {
    const user = req.user;
    if (!user || typeof user !== 'object')
        return null;
    const id = user.id;
    if (typeof id === 'string' && id)
        return id;
    if (typeof id === 'number' && Number.isFinite(id))
        return String(id);
    return null;
}
