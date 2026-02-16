import { useMemo, useState, useEffect, useRef } from "react"
import { useSearchParams, useRouter } from "next/navigation";
import { schemaToQueryString as fnSchemaToQueryString, SchemaToQueryStringConfig } from "@fabriciogferreira/schema-to-query-string";
import { SingleParserBuilder } from 'nuqs'

type InferParser<P> =
  P extends SingleParserBuilder<infer T> ? T : number

type FiltersFromConfig<C extends FiltersConfig> = {
  [K in keyof C]?: InferParser<C[K]>
}

type FiltersConfig = Record<string, SingleParserBuilder<any>>

type Params<S extends FiltersConfig> = {
	sorts?: SortParam;
	normalizeFromUrl?: boolean
	filters?: S
	schemaToQueryString?: SchemaToQueryStringConfig
	filterParamAs?: string
	includeParamAs?: string
	sortParamAs?: string
}

type Direction = '-' | ''

export type Sort = {
	column: string;
	label: string;
	direction: Direction;
	include: boolean;
}

export type SortParam = Pick<Sort, 'column' | 'label'>[] | Sort['column'][]

//FIELDS
//FILTER
type AddFilter<C extends FiltersConfig> =
  <K extends keyof C>(
    key: K,
    value: InferParser<C[K]> | null
  ) => void
type RemoveFilter<C extends FiltersConfig> =
  <K extends keyof C>(
    key: K,
    value: InferParser<C[K]> | null
  ) => void
type AddFilterDebounced<C extends FiltersConfig> =
  <K extends keyof C>(
		key: K,
    value: InferParser<C[K]> | null,
		timeout?: number
	) => void;
//INCLUDE
type AddInclude = (includes: string | string[]) => void;
type RemoveInclude = (includes: string | string[]) => void;
//PAGE
type Page = number | null
type RemovePage = () => void;
//PER PAGE
type PerPage = number | null;
type RemovePerPage = () => void;
//SORT
type FindSort = (column: string) => Sort | undefined;
type HasSort = (column: string) => boolean | undefined;
type IsSortAsc = (column: string) => boolean | void;
type IsSortDesc = (column: string) => boolean | void;
type MoveSortUp = (column: string) => void;
type MoveSortDown = (column: string) => void;
type ToggleSort = (column: string) => void;
type ToggleSortDirection = (column: string) => void;
//QUERY STRING

export function useUrlQuery<T extends FiltersConfig>({
	normalizeFromUrl = true,
	schemaToQueryString,
	sorts: allowedSorts = [],
	filters: allowedFilters,
	filterParamAs: filterParam = 'filter',
	includeParamAs: includeParam = 'include',
	sortParamAs: sortParam = 'sort',
}: Params<T> = {}) {
	const router = useRouter();
	const searchParams = useSearchParams();
	const filterDebouncedTimeoutId = useRef<NodeJS.Timeout>(undefined);

	//FIELDS
	//FILTER
	type Filters = FiltersFromConfig<T>
	const [filters, setFilters] = useState<Filters>({});

	const filtersQueryString = useMemo(() => {
		if (allowedFilters === undefined) return ''

		return Object.entries(allowedFilters)
			.filter(([key]) => filters[key])
			.map(([key, value]) => {
				return filterParam + `[${key}]=${value.serialize(filters[key])}`
			})
			.join('&')
	}, [filters, allowedFilters]);

	const addFilter: AddFilter<T> = (column, value) => {
		setFilters(prevFilters => ({
			...prevFilters,
			[column]: value
		}));
	};

	const removeFilter: RemoveFilter<T> = (column) => {
		setFilters(prevFilters => {
			const newFilters = { ...prevFilters }

			delete newFilters[column]

			return newFilters
		});
	}

	const addFilterDebounced: AddFilterDebounced<T> = (column, value, timeout: number = 300) => {
		clearTimeout(filterDebouncedTimeoutId.current);

		filterDebouncedTimeoutId.current = setTimeout(() => {			
			addFilter(column, value);
		}, timeout);
	};

	//INCLUDE
	const [includes, setIncludes] = useState<string[]>([]);

	const includeString = useMemo(() => {
		return includes.join(',');
	}, [includes]);

	const includeQueryString = useMemo(() => {
		return includeString ? includeParam + '=' + includeString : '';
	}, [includeString]);

	const addInclude: AddInclude = (includes: string | string[]) => {
		const newIncludes = Array.isArray(includes) ? includes : [includes];

		setIncludes(newIncludes);
	}

	const removeInclude: RemoveInclude = (includesParam: string | string[]) => {
		const removeIncludes = Array.isArray(includesParam) ? includesParam : [includesParam];

		const newIncludes = includes.filter(inc => !removeIncludes.includes(inc));

		setIncludes(newIncludes);
	}

	//PAGE
	const [page, setPage] = useState<Page>(null);

	const pageString = useMemo(() => {
		return page ? page.toString() : '';
	}, [page]);

	const pageQueryString = useMemo(() => {
		return pageString ? 'page=' + pageString : '';
	}, [pageString]);

	const removePage: RemovePage = () => {
		setPage(null);
	}

	//PER PAGE
	const [perPage, setPerPage] = useState<PerPage>(null);

	const perPageString = useMemo(() => {
		return perPage ? perPage.toString() : '';
	}, [perPage]);

	const perPageQueryString = useMemo(() => {
		return perPageString ? 'perPage=' + perPageString : '';
	}, [perPageString]);

	const removePerPage: RemovePerPage = () => {
		setPerPage(null);
	}

	//SORT
	const normalizedSorts: Sort[] = allowedSorts.map(allowedSort => {
		const restItem = typeof allowedSort === 'string'
			? { column: allowedSort, label: allowedSort }
			: allowedSort;

		return {
			...restItem,
			direction: '',
			include: false
		}
	});

	const [sorts, setSorts] = useState<Sort[]>(normalizedSorts);

	const sortString = useMemo(() => {
		return sorts.filter(sort => sort.include)
			.map(sort => sort.direction + sort.column)
				.join(',')
	}, [sorts]);

	const sortQueryString = useMemo(() => {
		return sortString ? sortParam + '=' + sortString : '';
	}, [sortString]);

	const findSort: FindSort = (column: string) => {
		return sorts.find(sort => sort.column === column);
	}

	const hasSort: HasSort = (column: string) => {
		return findSort(column) !== undefined;
	};

	const isSortAscOrDesc = (column: string, direction: Direction) => {
		const sort = findSort(column);

		if (sort === undefined) return sort

		return sort.direction === direction;
	}

	const isSortAsc: IsSortAsc = (column: string) => {
		return isSortAscOrDesc(column, '');
	};
	const isSortDesc: IsSortDesc = (column: string) => {
		return isSortAscOrDesc(column, '-');
	}
	const moveSortUp: MoveSortUp = (column: string) => {
		let index = sorts.findIndex(sort => sort.column === column);

		if (index <= 0) return;

		const newSorts = [...sorts];

		if (index >= 1) {
			const from = index;
			const to = index - 1;
			[newSorts[from], newSorts[to]] = [newSorts[to], newSorts[from]];
			index = to;
		}

		setSorts(newSorts)
	};

	const moveSortDown: MoveSortDown = (column: string) => {
		let index = sorts.findIndex(sort => sort.column === column);

		if (index < 0 || index === sorts.length - 1) return;

		const newSorts = [...sorts];

		if (index < sorts.length - 1) {
			const from = index;
			const to = index + 1;
			[newSorts[from], newSorts[to]] = [newSorts[to], newSorts[from]];
			index = to;
		}

		setSorts(newSorts)
	}
	const toggleSort: ToggleSort = (column: string) => {
		const index = sorts.findIndex(sort => sort.column === column);

		if (index === -1) return;

		const newSorts = [...sorts];

		newSorts[index].include = !newSorts[index].include;

		setSorts(newSorts);
	};
	const toggleSortDirection: ToggleSortDirection = (column: string) => {
		const index = sorts.findIndex(s => s.column === column);

		if (index === -1) return;

		const newSorts = [...sorts];

		newSorts[index].direction = newSorts[index].direction === '' ? '-' : '';

		setSorts(newSorts);
	}
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
		const {
			string: resultSchemaConverted,
		} = fnSchemaToQueryString(
			schemaToQueryString.schema,
			schemaToQueryString.rootResource,
			schemaToQueryString.includeKey,
			schemaToQueryString.fieldsKey,
		)

		schemaConverted = resultSchemaConverted;
	}

	const queryString = useMemo(() => {
		const parts = [filtersQueryString, sortQueryString, includeQueryString, pageQueryString, perPageQueryString, schemaConverted].filter(Boolean);
		return parts.length ? '?' + parts.join('&') : '';
	}, [filtersQueryString, sortQueryString, includeQueryString, pageQueryString, perPageQueryString]);

	useEffect(() => {
		router.push(queryString)
	}, [queryString, router])

	//LIFECYCLE
	useEffect(() => {
		if (!normalizeFromUrl) return;

		if (searchParams == undefined) return

		const newFilters: Filters = {};

		for (const key in allowedFilters) {
			const paramValue = searchParams.get(filterParam + `[${key}]`)
			
			const parser = allowedFilters[key]
			
			//TODO: test what happens if paramValue is null, because parser.parse(null) non accepts null
			if (paramValue === null) {
				continue
			}

			const filterValue = parser.parse(paramValue)

			newFilters[key] = filterValue
		}

		const newSorts = [...sorts]

		searchParams.forEach((value, key) => {
			const sortMatch = key.match(`^${sortParam}$`);

			if (sortMatch) {
				const sortings = value.split(',');

				const orderingMap = new Map<string, number>();

				sortings.forEach((sorting, index) => {
					const column = sorting.replace(/^-/, '');

					const newSortIndex = newSorts.findIndex(newSort => newSort.column === column)

					if (newSortIndex < 0) return

					orderingMap.set(column, index);
					if (sorting.startsWith('-')) {
						newSorts[newSortIndex].direction = '-'
					}

					newSorts[newSortIndex].include = true
				});

				newSorts.sort((a, b) => {
					const aIndex = orderingMap.get(a.column);
					const bIndex = orderingMap.get(b.column);

					if (aIndex === undefined && bIndex === undefined) return 0;
					if (aIndex === undefined) return 1;
					if (bIndex === undefined) return -1;

					return aIndex - bIndex;
				})

				return
			}
		});

		setFilters(newFilters)
		setSorts(newSorts)
	}, [normalizeFromUrl])

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
	}
}
