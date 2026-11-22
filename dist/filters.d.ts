import { SingleParserBuilder } from 'nuqs';
export type InferParser<P> = P extends SingleParserBuilder<infer T> ? T : number;
export type FiltersConfig = Record<string, SingleParserBuilder<any>>;
export type FiltersFromConfig<C extends FiltersConfig> = {
    [K in keyof C]?: InferParser<C[K]>;
};
/** Spatie-style `filter[key]=value` (joined with `&`). */
export declare function buildFiltersQueryString<C extends FiltersConfig>(allowedFilters: C | undefined, filters: FiltersFromConfig<C>, filterParam: string): string;
/** Read allowed filters from the current URL search params. */
export declare function parseFiltersFromSearchParams<C extends FiltersConfig>(searchParams: {
    get(name: string): string | null;
} | undefined | null, allowedFilters: C | undefined, filterParam: string): FiltersFromConfig<C>;
export declare function addFilterValue<C extends FiltersConfig, K extends keyof C>(prevFilters: FiltersFromConfig<C>, column: K, value: InferParser<C[K]> | null): FiltersFromConfig<C>;
export declare function removeFilterValue<C extends FiltersConfig, K extends keyof C>(prevFilters: FiltersFromConfig<C>, column: K): FiltersFromConfig<C>;
