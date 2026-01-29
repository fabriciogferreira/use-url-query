import { useMemo, useState, useEffect } from "react"
import { useSearchParams } from "next/navigation";
import { schemaToQueryString as fnSchemaToQueryString } from "@fabriciogferreira/schema-to-query-string";
import z4, { ZodObject, ZodRawShape } from "zod/v4";

type Params<S extends ZodRawShape> = {
	sorts?: SortParam;
  normalizeFromUrl?: boolean
  filterSchema?: ZodObject<S>
		schemaToQueryString?: {
		schema: ZodObject
		rootResource: string
		includeKey: string | undefined
		fieldsKey: string | undefined
	}
}

type FiltersFromSchema<S extends ZodRawShape> = {
  [K in keyof S]?: z4.infer<S[K]>
} & Record<string, unknown>

type Direction = '-' | ''

export type Sort = {
	column: string;
	label: string;
	direction: Direction;
	include: boolean;
}

type SortParam = Pick<Sort, 'column' | 'label'>[] | Sort['column'][]

//FIELDS
//FILTER
type AddFilter = (column: string, value: unknown) => void;
type RemoveFilter = (column: string, value: unknown) => void;
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

export function useUrlQuery<S extends z4.ZodRawShape = {}>({
	sorts: initialSorts = [],
	normalizeFromUrl = true,
	schemaToQueryString,
	filterSchema
}: Params<S> = {}) {
	//LIFECYCLE INIT
	const normalizedSorts: Sort[] = initialSorts.map(Parasort => {
		const restItem = typeof Parasort === 'string'
			? { column: Parasort, label: Parasort }
			: Parasort;

		return {
			...restItem,
			direction: '',
			include: false
		}
	});

	let schemaConverted = '';
	if (schemaToQueryString) {
		schemaConverted = fnSchemaToQueryString(
			schemaToQueryString.schema,
			schemaToQueryString.rootResource,
			schemaToQueryString.includeKey,
			schemaToQueryString.fieldsKey,
		)
	}

	//FIELDS
	//FILTER
	type Filters = FiltersFromSchema<S>
	const [filters, setFilters] = useState<Filters>({});

	const filtersQueryString = useMemo(() => {
		return Object.entries(filters)
			.map(([key, value]) => {
				let valueParsed = '';
				if (typeof value === 'bigint') {
					valueParsed = value.toString()
				} else if (typeof value === 'boolean') {
					valueParsed = value ? '1' : '0'
				} else if (typeof value === 'number') {
					valueParsed = value.toString()
				} else if (typeof value === 'string') {
					valueParsed = value
				} else if (Array.isArray(value)) {
					valueParsed = value.join(',')
				} else {
					valueParsed = JSON.stringify(value)
				}

				return `filter[${key}]=${value}`
			})
			.join(',')
	}, [filters]);

	const addFilter: AddFilter = (column: string, value: unknown) => {
		setFilters(prevFilters => ({
			...prevFilters,
			[column]: value
		}));
	};

	const removeFilter: RemoveFilter = (column: string) => {
		setFilters(prevFilters => {
			const newFilters = { ...prevFilters }

			delete newFilters[column]

			return newFilters
		});
	}

	//INCLUDE
	const [includes, setIncludes] = useState<string[]>([]);

	const includeString = useMemo(() => {
		return includes.join(',');
	}, [includes]);

	const includeQueryString = useMemo(() => {
		return includeString ? 'include=' + includeString : '';
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
	const [sorts, setSorts] = useState<Sort[]>(normalizedSorts);

	const sortString = useMemo(() => sorts.filter(sort => sort.include).map(sort => sort.direction + sort.column)
		.join(','), [sorts]);

	const sortQueryString = useMemo(() => {
		return sortString ? 'sort=' + sortString : '';
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
	const queryString = useMemo(() => {
		const parts = [filtersQueryString, sortQueryString, includeQueryString, pageQueryString, perPageQueryString, schemaConverted].filter(Boolean);
		return parts.length ? '?' + parts.join('&') : '';
	}, [filtersQueryString, sortQueryString, includeQueryString, pageQueryString, perPageQueryString]);

	//LIFECYCLE
	useEffect(() => {
		if (!normalizeFromUrl) return;

		const searchParams = useSearchParams();

		if (searchParams == undefined) return

		const newFilters: Record<string, unknown> = {};
		const newSorts = [...sorts]

		searchParams.forEach((value, key) => {
			const filterMatch = key.match(/^filter\[(.+)\]$/);

			if (filterMatch) {
				const column = filterMatch[1];

				if (filterSchema?.shape[column]) {
					const field = filterSchema.shape[column]

					if (field instanceof z4.ZodType) {
						const result = field.safeParse(value)

						if (result.success) {
							newFilters[column] = result.data
							return
						}
					}
				}

				newFilters[column] = value;

				return
			}

			const sortMatch = key.match(/^sort$/);

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

		setFilters(newFilters as Filters)
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
