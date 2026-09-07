import type { RelationshipFieldClientProps } from 'payload';
import React from 'react';
type ActorFieldProps = RelationshipFieldClientProps & {
    eventTypesSlug: string;
};
/** Relationship field that only renders when the selected event type requires an actor. */
export declare function ActorField(props: ActorFieldProps): React.JSX.Element | null;
export {};
//# sourceMappingURL=ActorField.d.ts.map