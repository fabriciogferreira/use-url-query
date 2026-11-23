/** Spatie-style `fields[resource]=id,name` state. */
export type Fields = Record<string, string[]>;
/** Build `fields[users]=id,name&fields[posts]=title` (joined with `&`). */
export declare function buildFieldsQueryString(fields: Fields, fieldParam: string): string;
/** Read `fields[resource]=…` entries from the current URL search params. */
export declare function parseFieldsFromSearchParams(searchParams: {
    forEach(callback: (value: string, key: string) => void): void;
} | null | undefined, fieldParam: string): Fields;
/** Merge field names into a resource (deduped, order preserved). */
export declare function addFieldValue(prevFields: Fields, resource: string, fields: string | string[]): Fields;
/**
 * Remove field names from a resource.
 * Omit `fields` (or pass nothing to remove) to drop the whole resource entry.
 */
export declare function removeFieldValue(prevFields: Fields, resource: string, fields?: string | string[]): Fields;
