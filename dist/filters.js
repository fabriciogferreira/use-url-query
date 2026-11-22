/** Spatie-style `filter[key]=value` (joined with `&`). */
export function buildFiltersQueryString(allowedFilters, filters, filterParam) {
    if (allowedFilters === undefined) {
        return '';
    }
    return Object.entries(allowedFilters)
        .filter(([key]) => filters[key])
        .map(([key, parser]) => {
        return (filterParam + `[${key}]=${parser.serialize(filters[key])}`);
    })
        .join('&');
}
/** Read allowed filters from the current URL search params. */
export function parseFiltersFromSearchParams(searchParams, allowedFilters, filterParam) {
    const newFilters = {};
    if (!searchParams || allowedFilters === undefined) {
        return newFilters;
    }
    for (const key in allowedFilters) {
        const paramValue = searchParams.get(filterParam + `[${key}]`);
        const parser = allowedFilters[key];
        if (paramValue === null) {
            continue;
        }
        newFilters[key] = parser.parse(paramValue);
    }
    return newFilters;
}
export function addFilterValue(prevFilters, column, value) {
    return {
        ...prevFilters,
        [column]: value,
    };
}
export function removeFilterValue(prevFilters, column) {
    const newFilters = { ...prevFilters };
    delete newFilters[column];
    return newFilters;
}
