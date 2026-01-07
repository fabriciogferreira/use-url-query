import { useMemo, useState, Dispatch, SetStateAction } from "react"

type Set<T> = Dispatch<SetStateAction<T>>

type Direction = '-' | ''

type Sort = {
	column: string;
	label: string;
	direction: Direction;
	include: boolean;
}

type SortParam = Pick<Sort, 'column' | 'label'>[] | Sort['column'][]

type Params = {
	sorts?: SortParam;
}

//FILTER
type Filters = Record<PropertyKey, unknown>;
type FilterQueryString = string;
type FilterBy = (column: string, value: unknown) => true;
//SORT
type Sorts = Sort[];
type SortString = string;
type SortQueryString = string;
type FindSort = (column: string) => Sort | undefined;
type GoUpSort = (column: string) => true | undefined;
type InternalGoUpSort = (sorts: Sort[], index: number) => Sort[];
type GoDownSort = (column: string) => boolean | undefined;
type InternalGoDownSort = (sorts: Sort[], index: number) => Sort[];
type HasSort = (column: string) => boolean | undefined;
type InternalToggleSortState = (sorts: Sort[], column: string) => Sort[];
type ToggleSortState = (column: string) => boolean | undefined;
type InternalToggleSortDirection = (sorts: Sort[], index: number) => Sort[];
type ToggleDirectionSort = (column: string) => boolean | undefined;
type SortIsAsc = (column: string) => boolean | undefined;
type SortIsDesc = (column: string) => boolean | undefined;
//INCLUDE
type IncludeString = string;
type IncludeQueryString = string;
type AddInclude = (includes: string | string[]) => true;
type RemInclude = (includes: string | string[]) => true;
//FIELDS
//PAGE
type Page = number | null
type setPage = Set<Page>;
type PageString = string;
type PageQueryString = string;
type RemPage = () => true;
//PER PAGE
type PerPage = number | null;
type setPerPage = Set<PerPage>;
type PerPageString = string;
type PerPageQueryString = string;
type RemPerPage = () => void;
//QUERY STRING
type QueryString = string;

export type UseUrlQuery = (params: Params) => {
	//FILTER
	filters: Filters;
	filterQueryString: FilterQueryString;
	filterBy: FilterBy;
	//SORT
	sorts: Sorts;
	sortString: SortString;
	sortQueryString: SortQueryString;
	// sortToEnd: Function;
	// sortToBegin: Function;
	goUpSort: GoUpSort
	internalGoUpSort: InternalGoUpSort;
	goDownSort: GoDownSort;
	internalGoDownSort: InternalGoDownSort;
	hasSort: HasSort;
	internalToggleSortState: InternalToggleSortState;
	toggleSortState: ToggleSortState;
	toggleDirectionSort: ToggleDirectionSort;
	sortIsAsc: SortIsAsc;
	sortIsDesc: SortIsDesc;
	//INCLUDE
	includeString: IncludeString;
	includeQueryString: IncludeQueryString;
	addInclude: AddInclude;
	remInclude: RemInclude;
	//FIELDS
	//PAGE
	page: Page;
	setPage: setPage;
	pageString: PageString;
	pageQueryString: PageQueryString;
	remPage: RemPage;
	//PER PAGE
	perPage: PerPage;
	setPerPage: setPerPage;
	perPageString: PerPageString;
	perPageQueryString: PerPageQueryString;
	remPerPage: RemPerPage;
	//QUERY STRING
	queryString: QueryString;
}

export type UseUrlQueryContext = ReturnType<UseUrlQuery>;

export const useUrlQuery: UseUrlQuery = ({
	sorts: initialSorts = []
}) => {
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

	//FILTER
	const [filters, setFilters] = useState<Filters>({});

	const filterQueryString: FilterQueryString = useMemo(() => Object.entries(filters)
		.map(([key, value]) => `filter[${key}]=${value}`
		)
		.join(','), [filters]);

	const filterBy: FilterBy = (column: string, value: unknown) => {
		setFilters(prevFilters => ({
			...prevFilters,
			[column]: value
		}));

		return true;
	};

	//SORT
	const [sorts, setSorts] = useState<Sort[]>(normalizedSorts);

	const sortString: SortString = useMemo(() => sorts.filter(sort => sort.include).map(sort => sort.direction + sort.column)
		.join(','), [sorts]);

	const sortQueryString: SortQueryString = useMemo(() => {
		return sortString ? 'sort=' + sortString : '';
	}, [sortString]);

	const findSort: FindSort = (column: string) => {
		return sorts.find(sort => sort.column === column);
	}
	// function sortToEnd() { };
	// function sortToBegin() { };
	const internalGoUpSort: InternalGoUpSort = (sorts: Sort[], index: number): Sort[] => {
		const newSorts = [...sorts];

		if (index >= 1) {
			const from = index;
			const to = index - 1;
			[newSorts[from], newSorts[to]] = [newSorts[to], newSorts[from]];
			index = to;
		}

		return newSorts;
	}
	const goUpSort: GoUpSort = (column: string) => {
		let index = sorts.findIndex(sort => sort.column === column);

		if (index < 0) return undefined;

		if (index === 0) return true;

		setSorts(internalGoUpSort(sorts, index));

		return true;
	};
	const internalGoDownSort: InternalGoDownSort = (sorts: Sort[], index: number): Sort[] => {
		const newSorts = [...sorts];

		if (index < sorts.length - 1) {
			const from = index;
			const to = index + 1;
			[newSorts[from], newSorts[to]] = [newSorts[to], newSorts[from]];
			index = to;
		}

		return newSorts;
	}
	const goDownSort: GoDownSort = (column: string) => {
		let index = sorts.findIndex(sort => sort.column === column);

		if (index < 0) return undefined;

		if (index === sorts.length - 1) return true;

		setSorts(internalGoDownSort(sorts, index));

		return true;
	}
	// function swapSorts() { };
	// function moveSortTo() { };
	const hasSort: HasSort = (column: string) => {
		return findSort(column) !== undefined;
	};
	const internalToggleSortState: InternalToggleSortState = (sorts: Sort[], column: string) => {
		const newSorts = [...sorts];

		const index = newSorts.findIndex(sort => sort.column === column);

		newSorts[index].include = !newSorts[index].include;

		return newSorts;
	}
	const toggleSortState: ToggleSortState = (column: string) => {
		const sort = findSort(column);

		if (sort === undefined) return sort

		const newSorts = internalToggleSortState(sorts, column);

		setSorts(newSorts);

		return true
	};
	// function disableSort() { };
	// function enableSort() { }
	// function disableSorts() { };
	// function enableSorts() { }
	const internalToggleSortDirection: InternalToggleSortDirection = (sorts: Sort[], index: number) => {
		const newSorts = [...sorts];

		newSorts[index].direction = newSorts[index].direction === '' ? '-' : '';

		return newSorts;
	}
	const toggleDirectionSort: ToggleDirectionSort = (column: string) => {
		const index = sorts.findIndex(s => s.column === column);

		if (index === -1) return undefined

		const newSorts = internalToggleSortDirection(sorts, index);

		setSorts(newSorts);

		return true
	}
	const sortIsAsc: SortIsAsc = (column: string) => {
		const sort = findSort(column);

		if (sort === undefined) return sort

		return sort.direction === '';
	};
	const sortIsDesc: SortIsDesc = (column: string) => {
		const sort = findSort(column);

		if (sort === undefined) return sort

		return sort.direction === '-';
	}

	//INCLUDE
	const [includes, setIncludes] = useState<string[]>([]);

	const includeString: IncludeString = useMemo(() => {
		return includes.join(',');
	}, [includes]);

	const includeQueryString: IncludeQueryString = useMemo(() => {
		return includeString ? 'include=' + includeString : '';
	}, [includeString]);

	const addInclude: AddInclude = (includes: string | string[]) => {
		const newIncludes = Array.isArray(includes) ? includes : [includes];

		setIncludes(newIncludes);

		return true;
	}

	const remInclude: RemInclude = (includesParam: string | string[]) => {
		const remIncludes = Array.isArray(includesParam) ? includesParam : [includesParam];

		const newIncludes = includes.filter(inc => !remIncludes.includes(inc));

		setIncludes(newIncludes);

		return true;
	}

	//FIELDS

	//PAGE
	const [page, setPage] = useState<Page>(null);

	const pageString: PageString = useMemo(() => {
		return page ? page.toString() : '';
	}, [page]);

	const pageQueryString: PageQueryString = useMemo(() => {
		return pageString ? 'page=' + pageString : '';
	}, [pageString]);

	const remPage: RemPage = () => {
		setPage(null);
		return true
	}

	//PER PAGE
	const [perPage, setPerPage] = useState<PerPage>(null);

	const perPageString: PerPageString = useMemo(() => {
		return perPage ? perPage.toString() : '';
	}, [perPage]);

	const perPageQueryString: PerPageQueryString = useMemo(() => {
		return perPageString ? 'perPage=' + perPageString : '';
	}, [perPageString]);

	const remPerPage: RemPerPage = () => {
		setPerPage(null);
		return true;
	}

	//QUERY STRING
	const queryString: QueryString = useMemo(() => {
		const parts = [filterQueryString, sortQueryString, includeQueryString, pageQueryString, perPageQueryString].filter(Boolean);
		return parts.length ? '?' + parts.join('&') : '';
	}, [filterQueryString, sortQueryString, includeQueryString, pageQueryString, perPageQueryString]);

	return {
		//FILTER
		filters,
		filterQueryString,
		filterBy,
		//SORT
		sorts,
		sortString,
		sortQueryString,
		// sortToEnd,
		// sortToBegin,
		internalGoUpSort,
		goUpSort,
		internalGoDownSort,
		goDownSort,
		// swapSorts,
		// moveSortTo,
		hasSort,
		internalToggleSortState,
		toggleSortState,
		// disableSort,
		// enableSort,
		// disableSorts,
		// enableSorts,
		toggleDirectionSort,
		sortIsAsc,
		sortIsDesc,
		//INCLUDE
		includes,
		includeString,
		includeQueryString,
		addInclude,
		remInclude,
		//FIELDS
		//PAGE
		page,
		setPage,
		pageString,
		pageQueryString,
		remPage,
		//PER PAGE
		perPage,
		setPerPage,
		perPageString,
		perPageQueryString,
		remPerPage,
		//QUERY STRING
		queryString,
	}
}

/*
FEATURES FUTURAS:
- trocar sort para sorting onde faz sentido
- analisar nomencatura de funções, por exemplo: addInclude poderia ser apenas include
- Suporte a appends
- Suporte a filtros
- suporte a fields
- normalização de valores vindos da URL
- atualização da URL
- tests podem ser melhoradods, no goUpSort ele deve rodar todos os tests para cada data set: column = p0 column = n !== 0
- Implementar testes para usestatee
- permitir configuração de delimitadores para include, appends, fields, sorts, filters

- permitir alterar os nomes dos parâmetros: sort, include, append, fields, page, perPage, filter, exemplo sortAs: string, 
	//STRING, NUMBER, BOOLEAN, ARRAY, NULL=''
	// EQUAL, NOT_EQUAL, GREATER_THAN, LESS_THAN, GREATER_THAN_OR_EQUAL, LESS_THAN_OR_EQUAL, and DYNAMIC
	//EQUAL - =
	//NOT_EQUAL - != - ne
	//GREATER_THAN - > - gt
	//LESS_THAN - < - lt
	//GREATER_THAN_OR_EQUAL - >= - gte
	//LESS_THAN_OR_EQUAL - <= - lte
	//DYNAMIC
	// const filterByNE = '';
	// const filterByGT = '';
	// const filterByLT = '';
	// const filterByGTE = '';
	// const filterByLTE = '';
	//CRIAR DEBOUNCED FILTER
	// const filterDebouncedBy = '';
	// const removeFilter = '';
*/