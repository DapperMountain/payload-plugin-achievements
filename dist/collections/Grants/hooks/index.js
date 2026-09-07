import { ensureUniqueGrant } from './ensureUniqueGrant';
import { fillGrantTitle, setGrantTitle } from './setGrantTitle';
export const hooks = {
    beforeValidate: [ensureUniqueGrant],
    beforeChange: [setGrantTitle],
    afterRead: [fillGrantTitle],
};
