/**
 * Cycle a catalog sort: off → asc (moved to last) → desc → off.
 */
export function cycleSortValue(sorts, column) {
    const index = sorts.findIndex((sort) => sort.column === column);
    if (index === -1) {
        return sorts;
    }
    const current = sorts[index];
    const next = [...sorts];
    if (!current.include) {
        const [item] = next.splice(index, 1);
        next.push({
            ...item,
            include: true,
            direction: "",
        });
        return next;
    }
    if (current.direction === "") {
        next[index] = {
            ...current,
            direction: "-",
        };
        return next;
    }
    next[index] = {
        ...current,
        include: false,
        direction: "",
    };
    return next;
}
export function normalizeSorts(allowedSorts) {
    return allowedSorts.map((allowedSort) => {
        const restItem = typeof allowedSort === "string"
            ? { column: allowedSort, label: allowedSort }
            : allowedSort;
        return {
            ...restItem,
            direction: "",
            include: false,
        };
    });
}
