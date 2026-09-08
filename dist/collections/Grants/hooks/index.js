import { ensureUniqueGrant } from './ensureUniqueGrant';
import { fillGrantTitle, setGrantTitle } from './setGrantTitle';
import { afterGrantChange, afterGrantDelete } from './afterGrantMutation';
export const hooks = {
    beforeValidate: [ensureUniqueGrant],
    beforeChange: [setGrantTitle],
    afterRead: [fillGrantTitle],
    afterChange: [afterGrantChange],
    afterDelete: [afterGrantDelete],
};
