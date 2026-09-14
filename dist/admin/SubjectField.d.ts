import type { RelationshipFieldClientProps } from 'payload';
import React from 'react';
type SubjectFieldProps = RelationshipFieldClientProps & {
    eventTypesSlug: string;
    /** Plugin allowlist — used when the event type leaves `subjectRelationTo` empty. */
    subjectCollections: string[];
};
/**
 * Polymorphic subject — only when the selected event type requires a host document.
 * Clears the value when the type does not require a subject.
 */
export declare function SubjectField(props: SubjectFieldProps): React.JSX.Element | null;
export {};
//# sourceMappingURL=SubjectField.d.ts.map