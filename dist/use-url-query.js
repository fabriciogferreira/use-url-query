import { useMemo, useState, useEffect, useRef } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { schemaToQueryString as fnSchemaToQueryString } from "@fabriciogferreira/schema-to-query-string";
import { addFilterValue, buildFiltersQueryString, parseFiltersFromSearchParams, removeFilterValue, } from './filters';
//QUERY STRING
export function useUrlQuery({ normalizeFromUrl = true, schemaToQueryString, sorts: allowedSorts = [], filters: allowedFilters, filterParamAs: filterParam = 'filter', includeParamAs: includeParam = 'include', sortParamAs: sortParam = 'sort', } = {}) {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const filterDebouncedTimeoutId = useRef(undefined);
    const [filters, setFilters] = useState({});
    const filtersQueryString = useMemo(() => {
        return buildFiltersQueryString(allowedFilters, filters, filterParam);
    }, [filters, allowedFilters, filterParam]);
    const addFilter = (column, value) => {
        setFilters(prevFilters => addFilterValue(prevFilters, column, value));
    };
    const removeFilter = (column) => {
        setFilters(prevFilters => removeFilterValue(prevFilters, column));
    };
    const addFilterDebounced = (column, value, timeout = 500) => {
        clearTimeout(filterDebouncedTimeoutId.current);
        filterDebouncedTimeoutId.current = setTimeout(() => {
            addFilter(column, value);
        }, timeout);
    };
    //INCLUDE
    const [includes, setIncludes] = useState([]);
    const includeString = useMemo(() => {
        return includes.join(',');
    }, [includes]);
    const includeQueryString = useMemo(() => {
        return includeString ? includeParam + '=' + includeString : '';
    }, [includeString]);
    const addInclude = (includes) => {
        const newIncludes = Array.isArray(includes) ? includes : [includes];
        setIncludes(newIncludes);
    };
    const removeInclude = (includesParam) => {
        const removeIncludes = Array.isArray(includesParam) ? includesParam : [includesParam];
        const newIncludes = includes.filter(inc => !removeIncludes.includes(inc));
        setIncludes(newIncludes);
    };
    //PAGE
    const [page, setPage] = useState(null);
    const pageString = useMemo(() => {
        return page ? page.toString() : '';
    }, [page]);
    const pageQueryString = useMemo(() => {
        return pageString ? 'page=' + pageString : '';
    }, [pageString]);
    const removePage = () => {
        setPage(null);
    };
    //PER PAGE
    const [perPage, setPerPage] = useState(null);
    const perPageString = useMemo(() => {
        return perPage ? perPage.toString() : '';
    }, [perPage]);
    const perPageQueryString = useMemo(() => {
        return perPageString ? 'perPage=' + perPageString : '';
    }, [perPageString]);
    const removePerPage = () => {
        setPerPage(null);
    };
    //SORT
    const normalizedSorts = allowedSorts.map(allowedSort => {
        const restItem = typeof allowedSort === 'string'
            ? { column: allowedSort, label: allowedSort }
            : allowedSort;
        return {
            ...restItem,
            direction: '',
            include: false
        };
    });
    const [sorts, setSorts] = useState(normalizedSorts);
    const sortString = useMemo(() => {
        return sorts.filter(sort => sort.include)
            .map(sort => sort.direction + sort.column)
            .join(',');
    }, [sorts]);
    const sortQueryString = useMemo(() => {
        return sortString ? sortParam + '=' + sortString : '';
    }, [sortString]);
    const findSort = (column) => {
        return sorts.find(sort => sort.column === column);
    };
    const hasSort = (column) => {
        return findSort(column) !== undefined;
    };
    const isSortAscOrDesc = (column, direction) => {
        const sort = findSort(column);
        if (sort === undefined)
            return sort;
        return sort.direction === direction;
    };
    const isSortAsc = (column) => {
        return isSortAscOrDesc(column, '');
    };
    const isSortDesc = (column) => {
        return isSortAscOrDesc(column, '-');
    };
    const moveSortUp = (column) => {
        let index = sorts.findIndex(sort => sort.column === column);
        if (index <= 0)
            return;
        const newSorts = [...sorts];
        if (index >= 1) {
            const from = index;
            const to = index - 1;
            [newSorts[from], newSorts[to]] = [newSorts[to], newSorts[from]];
            index = to;
        }
        setSorts(newSorts);
    };
    const moveSortDown = (column) => {
        let index = sorts.findIndex(sort => sort.column === column);
        if (index < 0 || index === sorts.length - 1)
            return;
        const newSorts = [...sorts];
        if (index < sorts.length - 1) {
            const from = index;
            const to = index + 1;
            [newSorts[from], newSorts[to]] = [newSorts[to], newSorts[from]];
            index = to;
        }
        setSorts(newSorts);
    };
    const toggleSort = (column) => {
        const index = sorts.findIndex(sort => sort.column === column);
        if (index === -1)
            return;
        const newSorts = [...sorts];
        newSorts[index].include = !newSorts[index].include;
        setSorts(newSorts);
    };
    const toggleSortDirection = (column) => {
        const index = sorts.findIndex(s => s.column === column);
        if (index === -1)
            return;
        const newSorts = [...sorts];
        newSorts[index].direction = newSorts[index].direction === '' ? '-' : '';
        setSorts(newSorts);
    };
    // function sortToEnd() { };
    // function sortToBegin() { };
    // function swapSorts() { };
    // function moveSortTo() { };
    // function disableSort() { };
    // function enableSort() { }
    // function disableSorts() { };
    // function enableSorts() { }
    //QUERY STRING
    let schemaConverted = '';
    if (schemaToQueryString) {
        const { string: resultSchemaConverted, } = fnSchemaToQueryString(schemaToQueryString.schema, schemaToQueryString.rootResource, schemaToQueryString.includeKey, schemaToQueryString.fieldsKey);
        schemaConverted = resultSchemaConverted;
    }
    const queryString = useMemo(() => {
        const parts = [filtersQueryString, sortQueryString, includeQueryString, pageQueryString, perPageQueryString, schemaConverted].filter(Boolean);
        return parts.length ? '?' + parts.join('&') : '';
    }, [filtersQueryString, sortQueryString, includeQueryString, pageQueryString, perPageQueryString]);
    useEffect(() => {
        // App Router needs a path; `push('')` / bare `?…` remounts and stalls consumers.
        // Compare decoded search (URLSearchParams encodes brackets; our queryString does not).
        const href = `${pathname}${queryString}`;
        const currentSearch = searchParams?.toString() ?? '';
        const hrefSearch = queryString.startsWith('?') ? queryString.slice(1) : queryString;
        const sameSearch = decodeURIComponent(currentSearch) === decodeURIComponent(hrefSearch);
        if (sameSearch) {
            return;
        }
        router.push(href);
    }, [queryString, router, pathname, searchParams]);
    //LIFECYCLE
    useEffect(() => {
        if (!normalizeFromUrl)
            return;
        if (searchParams == undefined)
            return;
        const newFilters = parseFiltersFromSearchParams(searchParams, allowedFilters, filterParam);
        const newSorts = [...sorts];
        searchParams.forEach((value, key) => {
            const sortMatch = key.match(`^${sortParam}$`);
            if (sortMatch) {
                const sortings = value.split(',');
                const orderingMap = new Map();
                sortings.forEach((sorting, index) => {
                    const column = sorting.replace(/^-/, '');
                    const newSortIndex = newSorts.findIndex(newSort => newSort.column === column);
                    if (newSortIndex < 0)
                        return;
                    orderingMap.set(column, index);
                    if (sorting.startsWith('-')) {
                        newSorts[newSortIndex].direction = '-';
                    }
                    newSorts[newSortIndex].include = true;
                });
                newSorts.sort((a, b) => {
                    const aIndex = orderingMap.get(a.column);
                    const bIndex = orderingMap.get(b.column);
                    if (aIndex === undefined && bIndex === undefined)
                        return 0;
                    if (aIndex === undefined)
                        return 1;
                    if (bIndex === undefined)
                        return -1;
                    return aIndex - bIndex;
                });
                return;
            }
        });
        setFilters(newFilters);
        setSorts(newSorts);
    }, [normalizeFromUrl]);
    return {
        //FIELDS
        // fields
        // fieldsString
        // fieldsQueryString
        // addField,
        // removeField,
        // toggleField,
        //FILTER
        filters,
        filtersQueryString,
        addFilter,
        removeFilter,
        addFilterDebounced,
        //INCLUDE
        includes,
        includeString,
        includeQueryString,
        addInclude,
        removeInclude,
        //PAGE
        page,
        pageString,
        pageQueryString,
        removePage,
        setPage,
        //PER PAGE
        perPage,
        perPageString,
        perPageQueryString,
        removePerPage,
        setPerPage,
        //SORT
        sorts,
        sortString,
        sortQueryString,
        hasSort,
        isSortAsc,
        isSortDesc,
        moveSortUp,
        moveSortDown,
        toggleSort,
        toggleSortDirection,
        // sortToEnd,
        // sortToBegin,
        // swapSorts,
        // moveSortTo,
        // disableSort,
        // enableSort,
        // disableSorts,
        // enableSorts,
        //QUERY STRING
        queryString,
    };
}
