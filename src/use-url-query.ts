import { useMemo, useState, Dispatch, SetStateAction, useEffect } from "react"
import { useSearchParams } from "next/navigation";
type Set<T> = Dispatch<SetStateAction<T>>

type Direction = '-' | ''

export type Sort = {
	column: string;
	label: string;
	direction: Direction;
	include: boolean;
}

type SortParam = Pick<Sort, 'column' | 'label'>[] | Sort['column'][]

type Params = {
	sorts?: SortParam;
	normalizeFromUrl?: boolean;
}

//FILTER
type Filters = Record<PropertyKey, unknown>;
type FiltersQueryString = string;
type AddFilter = (column: string, value: unknown) => true;
//SORT
type Sorts = Sort[];
type SortString = string;
type SortQueryString = string;
type FindSort = (column: string) => Sort | undefined;
type GoUpSort = (column: string) => true | undefined;
type GoDownSort = (column: string) => boolean | undefined;
type HasSort = (column: string) => boolean | undefined;
type ToggleSort = (column: string) => boolean | undefined;
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

export type UseUrlQuery = (params?: Params) => {
	//FILTER
	filters: Filters;
	filtersQueryString: FiltersQueryString;
	addFilter: AddFilter;
	//SORT
	sorts: Sorts;
	sortString: SortString;
	sortQueryString: SortQueryString;
	// sortToEnd: Function;
	// sortToBegin: Function;
	goUpSort: GoUpSort
	goDownSort: GoDownSort;
	hasSort: HasSort;
	toggleSort: ToggleSort;
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
	sorts: initialSorts = [],
	normalizeFromUrl = true,
} = {}) => {
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

	//FILTER
	const [filters, setFilters] = useState<Filters>({});

	const filtersQueryString = useMemo(() => Object.entries(filters)
		.map(([key, value]) => `filter[${key}]=${value}`
		)
		.join(','), [filters]);

	const addFilter: AddFilter = (column: string, value: unknown) => {
		setFilters(prevFilters => ({
			...prevFilters,
			[column]: value
		}));

		return true;
	};

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
	// function sortToEnd() { };
	// function sortToBegin() { };
	const goUpSort: GoUpSort = (column: string) => {
		let index = sorts.findIndex(sort => sort.column === column);

		if (index < 0) return undefined;

		if (index === 0) return true;

		const newSorts = [...sorts];

		if (index >= 1) {
			const from = index;
			const to = index - 1;
			[newSorts[from], newSorts[to]] = [newSorts[to], newSorts[from]];
			index = to;
		}

		setSorts(newSorts)

		return true;
	};

	const goDownSort: GoDownSort = (column: string) => {
		let index = sorts.findIndex(sort => sort.column === column);

		if (index < 0) return undefined;

		if (index === sorts.length - 1) return true;

		const newSorts = [...sorts];

		if (index < sorts.length - 1) {
			const from = index;
			const to = index + 1;
			[newSorts[from], newSorts[to]] = [newSorts[to], newSorts[from]];
			index = to;
		}

		setSorts(newSorts)

		return true;
	}
	// function swapSorts() { };
	// function moveSortTo() { };
	const hasSort: HasSort = (column: string) => {
		return findSort(column) !== undefined;
	};

	const toggleSort: ToggleSort = (column: string) => {
		const index = sorts.findIndex(sort => sort.column === column);

		if (index === -1) return undefined

		const newSorts = [...sorts];

		newSorts[index].include = !newSorts[index].include;

		setSorts(newSorts);

		return true
	};
	// function disableSort() { };
	// function enableSort() { }
	// function disableSorts() { };
	// function enableSorts() { }
	const toggleDirectionSort: ToggleDirectionSort = (column: string) => {
		const index = sorts.findIndex(s => s.column === column);

		if (index === -1) return undefined

		const newSorts = [...sorts];

		newSorts[index].direction = newSorts[index].direction === '' ? '-' : '';

		setSorts(newSorts);

		return true
	}

	const sortIsAscOrDesc = (column: string, direction: Direction) => {
		const sort = findSort(column);

		if (sort === undefined) return sort

		return sort.direction === direction;
	}

	const sortIsAsc: SortIsAsc = (column: string) => {
		return sortIsAscOrDesc(column, '');
	};
	const sortIsDesc: SortIsDesc = (column: string) => {
		return sortIsAscOrDesc(column, '-');
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

	const pageString = useMemo(() => {
		return page ? page.toString() : '';
	}, [page]);

	const pageQueryString = useMemo(() => {
		return pageString ? 'page=' + pageString : '';
	}, [pageString]);

	const remPage: RemPage = () => {
		setPage(null);
		return true
	}

	//PER PAGE
	const [perPage, setPerPage] = useState<PerPage>(null);

	const perPageString = useMemo(() => {
		return perPage ? perPage.toString() : '';
	}, [perPage]);

	const perPageQueryString = useMemo(() => {
		return perPageString ? 'perPage=' + perPageString : '';
	}, [perPageString]);

	const remPerPage: RemPerPage = () => {
		setPerPage(null);
		return true;
	}

	//QUERY STRING
	const queryString = useMemo(() => {
		const parts = [filtersQueryString, sortQueryString, includeQueryString, pageQueryString, perPageQueryString].filter(Boolean);
		return parts.length ? '?' + parts.join('&') : '';
	}, [filtersQueryString, sortQueryString, includeQueryString, pageQueryString, perPageQueryString]);

	//LIFECYCLE
	useEffect(() => {
		if (!normalizeFromUrl) return;

		const searchParams = useSearchParams();

		if (searchParams == undefined) return

		const newFilters: Record<string, string> = {};

		searchParams.forEach((value, key) => {
			const filterMatch = key.match(/^filter\[(.+)\]$/);

			if (filterMatch) {
				const column = filterMatch[1];

				newFilters[column] = value;

				return
			}

			const sortMatch = key.match(/^sort$/);

			if (sortMatch) {
				const sortings = value.split(',');

				const orderingMap = new Map<string, number>();

				sortings.forEach((sorting, index) => {
					const column = sorting.replace(/^-/, '');
					orderingMap.set(column, index);
					//TODO: melhorar, ao invés de editar cada propriedade por vez, criar um função que altere vários propriedades de uma vez ou melhor que altere várias propriedades de uma vez de vários items
					if (sorting.startsWith('-')) {
						toggleDirectionSort(column);
					}
					toggleSort(column);
				});

				setSorts(prev =>
					[...prev].sort((a, b) => {
						const aIndex = orderingMap.get(a.column);
						const bIndex = orderingMap.get(b.column);

						if (aIndex === undefined && bIndex === undefined) return 0;
						if (aIndex === undefined) return 1;
						if (bIndex === undefined) return -1;

						return aIndex - bIndex;
					})
				);

				return
			}
		});

		setFilters(newFilters)
	}, [normalizeFromUrl])

	return {
		//FILTER
		filters,
		filtersQueryString,
		addFilter,
		//SORT
		sorts,
		sortString,
		sortQueryString,
		// sortToEnd,
		// sortToBegin,
		goUpSort,
		goDownSort,
		// swapSorts,
		// moveSortTo,
		hasSort,
		toggleSort,
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
		// fields
		// fieldsString
		// fieldsQueryString
		// addField,
		// remField,
		// toggleField,
		//PAGE
		page,
		pageString,
		pageQueryString,
		setPage,
		remPage,
		//PER PAGE
		perPage,
		perPageString,
		perPageQueryString,
		setPerPage,
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


//AGUNS TESTS FALHAM
// const goUpOrDownSort = (column: string, factor: number) => {
// 	let index = sorts.findIndex(sort => sort.column === column);

// 	if (index < 0) return undefined;

// 	if (index === (factor ? sorts.length - 1 : 0)) return true;

// 	const newSorts = [...sorts];

// 	if (factor ? index < sorts.length - 1 : index >= 1) {
// 		const from = index;
// 		const to = index + factor;
// 		[newSorts[from], newSorts[to]] = [newSorts[to], newSorts[from]];
// 		index = to;
// 	}

// 	setSorts(newSorts)

// 	return true
// }