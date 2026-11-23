export type Direction = "-" | "";
export type Sort = {
    /** Name sent to the backend / URL (`sort=name`). */
    column: string;
    /** Label shown in the UI. */
    label: string;
    /** `''` ascending, `'-'` descending. */
    direction: Direction;
    /** Whether this sort is present in `sort=`. */
    include: boolean;
};
export type SortParam = Pick<Sort, "column" | "label">[] | Sort["column"][];
/**
 * Cycle a catalog sort: off → asc (moved to last) → desc → off.
 */
export declare function cycleSortValue(sorts: Sort[], column: string): Sort[];
export declare function normalizeSorts(allowedSorts: SortParam): Sort[];
