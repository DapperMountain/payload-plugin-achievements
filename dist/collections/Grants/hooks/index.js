import { ensureUniqueGrant } from './ensureUniqueGrant.js';
import { fillGrantTitle, setGrantTitle } from './setGrantTitle.js';
import { afterGrantChange, afterGrantDelete } from './afterGrantMutation.js';
export const hooks = {
    beforeValidate: [ensureUniqueGrant],
    beforeChange: [setGrantTitle],
    afterRead: [fillGrantTitle],
    afterChange: [afterGrantChange],
    afterDelete: [afterGrantDelete],
};
