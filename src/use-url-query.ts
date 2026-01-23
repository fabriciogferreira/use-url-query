import { useMemo, useState, Dispatch, SetStateAction, useEffect } from "react"
import { useSearchParams } from "next/navigation";
import { schemaToQueryString as fnSchemaToQueryString } from "@fabriciogferreira/schema-to-query-string";
import { ZodObject, ZodType } from "zod/v4";

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
	schemaToQueryString?: {
		schema: ZodObject
		rootResource: string
		includeKey: string | undefined
		fieldsKey: string | undefined
	}
	filterSchema?: Record<string, ZodType>
}

//FIELDS
//FILTER
type Filters = Record<PropertyKey, unknown>;
type FiltersQueryString = string;
type AddFilter = (column: string, value: unknown) => void;
type RemoveFilter = (column: string, value: unknown) => void;
//INCLUDE
type IncludeString = string;
type IncludeQueryString = string;
type AddInclude = (includes: string | string[]) => void;
type RemoveInclude = (includes: string | string[]) => void;
//PAGE
type Page = number | null
type setPage = Set<Page>;
type PageString = string;
type PageQueryString = string;
type RemovePage = () => void;
//PER PAGE
type PerPage = number | null;
type setPerPage = Set<PerPage>;
type PerPageString = string;
type PerPageQueryString = string;
type RemovePerPage = () => void;
//SORT
type Sorts = Sort[];
type SortString = string;
type SortQueryString = string;
type FindSort = (column: string) => Sort | undefined;
type HasSort = (column: string) => boolean | undefined;
type IsSortAsc = (column: string) => boolean | void;
type IsSortDesc = (column: string) => boolean | void;
type MoveSortUp = (column: string) => void;
type MoveSortDown = (column: string) => void;
type ToggleSort = (column: string) => void;
type ToggleSortDirection = (column: string) => void;
//QUERY STRING
type QueryString = string;

export type UseUrlQuery = (params?: Params) => {
	//FIELDS
	//FILTER
	filters: Filters;
	filtersQueryString: FiltersQueryString;
	addFilter: AddFilter;
	removeFilter: RemoveFilter;
	//INCLUDE
	includeString: IncludeString;
	includeQueryString: IncludeQueryString;
	addInclude: AddInclude;
	removeInclude: RemoveInclude;
	//PAGE
	page: Page;
	pageString: PageString;
	pageQueryString: PageQueryString;
	removePage: RemovePage;
	setPage: setPage;
	//SORT
	sorts: Sorts;
	sortString: SortString;
	sortQueryString: SortQueryString;
	// sortToEnd: Function;
	// sortToBegin: Function;
	hasSort: HasSort;
	isSortAsc: IsSortAsc;
	isSortDesc: IsSortDesc;
	moveSortUp: MoveSortUp
	moveSortDown: MoveSortDown;
	toggleSort: ToggleSort;
	toggleSortDirection: ToggleSortDirection;
	//PER PAGE
	perPage: PerPage;
	perPageString: PerPageString;
	perPageQueryString: PerPageQueryString;
	removePerPage: RemovePerPage;
	setPerPage: setPerPage;
	//QUERY STRING
	queryString: QueryString;
}

export type UseUrlQueryContext = ReturnType<UseUrlQuery>;

export const useUrlQuery: UseUrlQuery = ({
	sorts: initialSorts = [],
	normalizeFromUrl = true,
	schemaToQueryString,
	filterSchema
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

				if (filterSchema) {
					const schemaField = filterSchema[column]

					if (schemaField) {
						const result = schemaField.safeParse(value)

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

/*
FEATURES FUTURAS:
- Suporte a appends
- Suporte a filtros
- suporte a fields
- normalização de valores vindos da URL
- atualização da URL
- tests podem ser melhoradods, no goUpSort ele deve rodar todos os tests para cada data set: column = p0 column = n !== 0
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


// Padrão
//add...    void -> para adicionar, exemplo: addFilter
//clear...  void -> para limpar todos os valores de um param, exemplo: clearFilters
//get...    value-> para buscar determinado valor: getFilter
//has...    value-> para verificar se tem algo, exemplo: hasSort
//is...     value-> para verificar se é tal coisa, exemplo: isSortDesc
//move...		void -> para move um item para determinada posição
//remove... void -> para remover, exemplo: removeFilter
//reset...  void -> para voltar os valores para os valores iniciais: resetFilters
//set...    void -> para setar algo que tem apenas um valor, exemplo: setPage
//toggle... void -> para alternar o valor do param ou o parâmetro, exemplo: toggleSort
//up??
//swap??
//enable??
//disable??

//APLICAR A MESMA ESTRUTURA DO SORT PARA O FILTER, INCLUDE, FIELDS?
// PQ? EM ALGUNS CASOS, O USUÁRIO APENAS QUER DESATIVAR AQUELE FILTRO, E NÃO REMOVER ELE, PODE SER ÚTIL QUANDO SE ESTÁ TESTANDO FILTROS


// Ordernar areas assim
// FILEDS
// FILTERS
// INCLUDES
// PAGE
// PER_PAGE
// SORTS
// QUERY STRING


// 📌 Resumo honesto
// ❌ O que NÃO é problema

// Muitos useState

// .map, .filter, .join

// Lógica de query string

// ⚠️ O que é desperdício

// useMemo em valores triviais

// useMemo encadeado

// normalização fora do useState

// 🔥 O que merece atenção real

// useEffect chamando várias actions

// múltiplos setState em sequência

// dependências incompletas

// 🎯 Se eu tivesse que priorizar

// 1️⃣ Remover useMemo desnecessários
// 2️⃣ Inicializar sorts corretamente
// 3️⃣ Refatorar o useEffect para 1 setSorts

//FETURE: OPCIONALMENTE NÃO DISPARAR ATUALIZAÇÃO QUANDO um valor SORT (talvez), INCLUDES OU FIELDS É REMOVIDO, pois isso apenas não deveria mostrar um dados que já foi carregando, ou seja, não é preciso uma nova query para traze um conjunto de dados B que está contido em um conjunto de dados A