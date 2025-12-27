//ESBOÇO

// params
// schema
// default
// normalizeFromUrl
// updateUrl

import { useMemo, useState } from "react"

type Direction = '-' | ''

type Sort = {
	column: string;
	label: string;
	direction: Direction;
	include: boolean;
}

type SortParam = Pick<Sort, 'column' | 'label'>[] | Sort['column'][]

type Page = number | null
type PerPage = number | null

type UseUrlQueryParams = {
	sorts?: SortParam;
}

export function useUrlQuery({
	sorts: initialSorts = []
}: UseUrlQueryParams) {
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

	const [sorts, setSorts] = useState<Sort[]>(normalizedSorts);

	const sortString = useMemo(() => sorts.map(sort => sort.direction + sort.column)
		.join(','), [sorts]);

	const sortQueryString = useMemo(() => {
		return 'sort=' + sortString;
	}, [sortString]);

	const queryString = useMemo(() => {
		return '?' + sortQueryString;
	}, [sortQueryString]);

	function findSort(column: string) {
		return sorts.find(sort => sort.column === column);
	}
	// function sortToEnd() { };
	// function sortToBegin() { };
	function internalGoUpSort(sorts: Sort[], index: number): Sort[] {
		const newSorts = [...sorts];

		if (index >= 1) {
			const from = index;
			const to = index - 1;
			[newSorts[from], newSorts[to]] = [newSorts[to], newSorts[from]];
			index = to;
		}

		return newSorts;
	}
	function goUpSort(column: string) {
		let index = sorts.findIndex(sort => sort.column === column);

		if (index < 0) return undefined;

		if (index === 0) return true;

		setSorts(internalGoUpSort(sorts, index));

		return true;
	};
	function internalGoDownSort(sorts: Sort[], index: number): Sort[] {
		const newSorts = [...sorts];

		if (index < sorts.length - 1) {
			const from = index;
			const to = index + 1;
			[newSorts[from], newSorts[to]] = [newSorts[to], newSorts[from]];
			index = to;
		}

		return newSorts;
	}
	function goDownSort(column: string) {
		let index = sorts.findIndex(sort => sort.column === column);

		if (index < 0) return undefined;

		if (index === sorts.length - 1) return true;

		setSorts(internalGoDownSort(sorts, index));

		return true;
	}
	// function swapSorts() { };
	// function moveSortTo() { };
	function hasSort(column: string) {
		return findSort(column) !== undefined;
	};
	function internalToggleSortState(sorts: Sort[], column: string) {
		const newSorts = [...sorts];

		const index = newSorts.findIndex(sort => sort.column === column);

		newSorts[index].include = !newSorts[index].include;

		return newSorts;
	}
	function toggleSortState(column: string) {
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
	function internalToggleSortDirection(sorts: Sort[], index: number) {
		const newSorts = [...sorts];

		newSorts[index].direction = newSorts[index].direction === '' ? '-' : '';

		return newSorts;
	}
	function toggleDirectionSort(column: string) {
		const index = sorts.findIndex(s => s.column === column);

		if (index === -1) return undefined

		const newSorts = internalToggleSortDirection(sorts, index);

		setSorts(newSorts);

		return true
	}
	function sortIsAsc(column: string) {
		const sort = findSort(column);

		if (sort === undefined) return sort

		return sort.direction === '';
	};
	function sortIsDesc(column: string) {
		const sort = findSort(column);

		if (sort === undefined) return sort

		return sort.direction === '-';
	}

	//PAGE
	const [page, setPage] = useState<Page>(null);
	
	const pageString = useMemo(() => {
		return page ? page.toString() : '';
	}, [page]);
	
	const pageQueryString = useMemo(() => {
		return pageString ? 'page=' + pageString : '';
	}, [pageString]);

	function remPage() {
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

	function remPerPage() {
		setPerPage(null);
	}

	return {
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
		//FULL QUERY STRING
		queryString,
	}
}



/*
FEATURES FUTURAS:
- Suporte a filtros
- normalização de valores vindos da URL
- atualização da URL
- tests podem ser melhoradods, no goUpSort ele deve rodar todos os tests para cada data set: column = p0 column = n !== 0
- Implementar testes para usestatee
- permitir configuração de delimitadores para include, appends, fields, sorts, filters
*/