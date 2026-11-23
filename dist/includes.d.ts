/** Spatie-style `include=posts,permissions` list helpers. */
/** Build `include=posts,permissions` (empty when none). */
export declare function buildIncludesQueryString(includes: string[], includeParam: string): string;
/** Read `include=…` from the current URL search params. */
export declare function parseIncludesFromSearchParams(searchParams: {
    forEach(callback: (value: string, key: string) => void): void;
} | null | undefined, includeParam: string): string[];
/** Merge include names (deduped, order preserved). */
export declare function addIncludeValue(prevIncludes: string[], includes: string | string[]): string[];
/** Replace the include list. */
export declare function setIncludeValue(_prevIncludes: string[], includes: string | string[]): string[];
/** Clear all includes. */
export declare function clearIncludeValue(_prevIncludes?: string[]): string[];
/** Remove include names from the list. */
export declare function removeIncludeValue(prevIncludes: string[], includes: string | string[]): string[];
