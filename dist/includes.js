/** Spatie-style `include=posts,permissions` list helpers. */
function normalizeIncludeList(includes) {
    const list = Array.isArray(includes) ? includes : [includes];
    return list.map((include) => include.trim()).filter(Boolean);
}
/** Build `include=posts,permissions` (empty when none). */
export function buildIncludesQueryString(includes, includeParam) {
    const list = normalizeIncludeList(includes);
    return list.length > 0 ? `${includeParam}=${list.join(',')}` : '';
}
/** Read `include=…` from the current URL search params. */
export function parseIncludesFromSearchParams(searchParams, includeParam) {
    if (!searchParams) {
        return [];
    }
    let found = [];
    searchParams.forEach((value, key) => {
        if (key !== includeParam) {
            return;
        }
        found = normalizeIncludeList(value.split(','));
    });
    return found;
}
/** Merge include names (deduped, order preserved). */
export function addIncludeValue(prevIncludes, includes) {
    const toAdd = normalizeIncludeList(includes);
    if (toAdd.length === 0) {
        return prevIncludes;
    }
    const next = [...prevIncludes];
    for (const include of toAdd) {
        if (!next.includes(include)) {
            next.push(include);
        }
    }
    return next;
}
/** Replace the include list. */
export function setIncludeValue(_prevIncludes, includes) {
    return normalizeIncludeList(includes);
}
/** Clear all includes. */
export function clearIncludeValue(_prevIncludes = []) {
    return [];
}
/** Remove include names from the list. */
export function removeIncludeValue(prevIncludes, includes) {
    const toRemove = normalizeIncludeList(includes);
    if (toRemove.length === 0) {
        return prevIncludes;
    }
    return prevIncludes.filter((include) => !toRemove.includes(include));
}
