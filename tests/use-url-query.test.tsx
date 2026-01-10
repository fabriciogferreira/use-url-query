import { Sort, useUrlQuery } from "../src/use-url-query";
import { describe, expect, it, mock } from "bun:test";
import { renderHook, act } from "@testing-library/react";
import fastCartesian from 'fast-cartesian'
import { Permutation, PowerSet, } from 'js-combinatorics';
//Criar função que gere todas as combinações possíveis de sorts com essas configurações:
// ordem importa? &
// (size | min | max | min & max) ?
// includeVoid? 

let mockedSearchParams: URLSearchParams;

mock.module("next/navigation", () => ({
	useSearchParams: () => mockedSearchParams,
}));

function subsets<T>(arr: T[]): T[][] {
	const result: T[][] = [];

	const total = 1 << arr.length; // 2^n combinações

	for (let mask = 1; mask < total; mask++) {
		const subset: T[] = [];

		for (let i = 0; i < arr.length; i++) {
			if (mask & (1 << i)) {
				subset.push(arr[i]);
			}
		}

		result.push(subset);
	}

	return result;
}

// useUrlQuery
// 	params
// 		obrigatoriedade do objetos params
// 	funções
// 	states
// 	retorno
const shouldReturnTrueWhenSuccessful = (returned: boolean | undefined) => {
	it('should return true if successful', () => {
		expect(returned).toBe(true);
	});
}
const shouldReturnUndefinedWhenNotFound = (returned: boolean | undefined) => {
	it('should return undefined if not found', () => {
		expect(returned).toBe(undefined);
	});
}

//Regras globais para filtros:
//Nem sempre um filtro estará presente na URL, ou seja, todos os filtros são opcionais


//Regras
//Obrigar ele a passar todas as propriedades como opcionais

// TESTES FUTUROS
//E SE EU PASSAR FILTROS DUPLICADOS?
describe('params', () => {
	describe('normalizeFromUrl', () => {
		const filters = [['string', 'a'], ['number', '1'], ['boolean', 'true'], ['array', 'a,b,c'], ['null', '']]

		describe('filters', () => {
			const cases: [string, string[][]][] = subsets(filters).map((subset) => [subset.map(subsubset => subsubset.join('=')).join('&'), subset]);

			it.each(cases)('when query string is %s', (_, params: string[][]) => {
				const queryString = params.map(([key, value]) => `filter[${key}]=${value}`).join('&');

				mockedSearchParams = new URLSearchParams(queryString);

				let expectedFilters: Record<string, string> = {};

				params.forEach(([key, value]) => {
					expectedFilters[key] = value;
				})

				const { result } = renderHook(() =>
					useUrlQuery({
						normalizeFromUrl: true,
					})
				);

				expect(result.current.filters).toEqual(expectedFilters);
			})
		});

		describe('sorts', () => {

			const powerSets = [...new PowerSet('abcde')]

			const cases: [string, string[]][] = powerSets.map(powerSet => [powerSet.join(','), powerSet])

			//TODO: testar combinações com direções
			describe.each(cases)('when query string has %s sorts', (queryString, sortings: string[]) => {
				it('should change state include sorting from ' + queryString, () => {
					mockedSearchParams = new URLSearchParams(`sort=${queryString}`);

					const { result } = renderHook(() =>
						useUrlQuery({
							normalizeFromUrl: true,
							sorts: ["a", "b", "c"]
						})
					);

					const validSortings = sortings.filter(param => ["a", "b", "c"].includes(param));

					const expectedSorts: Sort[] = validSortings.map(param => {
						return {
							column: param,
							label: param,
							direction: '',
							include: true
						}
					});

					expect(result.current.sorts.filter(sort => sort.include)).toEqual(expectedSorts);
				})

				const sortingsWithDirection = sortings.map(sorting => fastCartesian([['', '-'], [sorting]]))

				const teste = fastCartesian(sortingsWithDirection);

				const permuted = teste.flatMap(group =>
					[...new Permutation(group)]
				);

				const cases2: [string, string[][]][] = permuted.map(permutation => [permutation.map(sort => sort.filter(Boolean).join('')).join(','), permutation]);

				it.each([
					['', []],
					...cases2
				])('should fix the order of sorts from query string when sort is %s', (queryString, sortings) => {
					mockedSearchParams = new URLSearchParams(`sort=${queryString}`);

					const sorts: Record<string, string> = {};

					sortings.flatMap(sort => {
						if (["a", "b", "c"].includes(sort[1])) {
							sorts[sort[1]] = sort[0];
						}
					});

					const { result } = renderHook(() =>
						useUrlQuery({
							normalizeFromUrl: true,
							sorts: ["a", "b", "c"]
						})
					);

					const validSortings: Sort[] = Object.entries(sorts).map(([key, value]) => {
						return ({
						column: key,
						label: key,
						direction: value as '' | '-',
						include: true
					})});
					
					expect(result.current.sorts.filter(sort => sort.include)).toEqual(validSortings);
				});
			});
		});
	});
	describe('sorts', () => {
		it('should initialize sorts correctly without label', () => {
			const { result: { current: urlQuery } } = renderHook(() =>
				useUrlQuery({
					sorts: ["asc", "desc"]
				})
			);

			expect(urlQuery.sorts).toEqual([
				{ column: 'asc', label: 'asc', direction: '', include: false },
				{ column: 'desc', label: 'desc', direction: '', include: false }
			]);
		});

		it('should initialize sorts correctly with label', () => {
			const { result: { current: urlQuery } } = renderHook(() =>
				useUrlQuery({
					sorts: [
						{ column: 'asc', label: 'Ascending' },
						{ column: 'desc', label: 'Descending' }
					]
				})
			);

			expect(urlQuery.sorts).toEqual([
				{ column: 'asc', label: 'Ascending', direction: '', include: false },
				{ column: 'desc', label: 'Descending', direction: '', include: false }
			]);
		});
	});
});

describe('sort', () => {
	const sorts = ['1', '2', '3', '4', '5'];

	describe.each([
		[sorts, 0, ['1', '2', '3', '4', '5']],
		[sorts, 1, ['2', '1', '3', '4', '5']],
		[sorts, 2, ['1', '3', '2', '4', '5']],
		[sorts, 3, ['1', '2', '4', '3', '5']],
		[sorts, 4, ['1', '2', '3', '5', '4']],
	])('goUpSort %i, %i', (initialSorts, indexToMove, expectedSorts) => {
		const { result } = renderHook(() =>
			useUrlQuery({
				sorts: initialSorts
			})
		);

		act(() => {
			result.current.goUpSort(initialSorts[indexToMove]);
		});

		act(() => {
			sorts.forEach(s => result.current.toggleSortState(s));
		});

		it('when move index %i up, should return %s', () => {
			expect(result.current.sorts.map(s => s.column)).toEqual(expectedSorts);
		});

		it('when move index %i up, should update sortString', () => {
			expect(result.current.sortString).toBe(expectedSorts.join(','));
		});

		it('when move index %i up, should update sortQueryString', () => {
			expect(result.current.sortQueryString).toBe('sort=' + expectedSorts.join(','));
		});
	});
	describe('goUpSort', () => {
		const { result: { current: urlQuery } } = renderHook(() =>
			useUrlQuery({
				sorts: ["asc", "desc", "name"]
			})
		);

		shouldReturnTrueWhenSuccessful(urlQuery.goUpSort('desc'));
		shouldReturnUndefinedWhenNotFound(urlQuery.goUpSort('not-found'));
	});

	describe.each([
		[sorts, 0, ['2', '1', '3', '4', '5']],
		[sorts, 1, ['1', '3', '2', '4', '5']],
		[sorts, 2, ['1', '2', '4', '3', '5']],
		[sorts, 3, ['1', '2', '3', '5', '4']],
		[sorts, 4, ['1', '2', '3', '4', '5']],
	])('goDownSort %i, %i', (initialSorts, indexToMove, expectedSorts) => {
		const { result } = renderHook(() =>
			useUrlQuery({
				sorts: initialSorts
			})
		);

		act(() => {
			result.current.goDownSort(initialSorts[indexToMove]);
		});

		act(() => {
			sorts.forEach(s => result.current.toggleSortState(s));
		});

		it('when move index %i up, should return %s', () => {
			expect(result.current.sorts.map(s => s.column)).toEqual(expectedSorts);
		});

		it('when move index %i up, should update sortString', () => {
			expect(result.current.sortString).toBe(expectedSorts.join(','));
		});

		it('when move index %i up, should update sortQueryString', () => {
			expect(result.current.sortQueryString).toBe('sort=' + expectedSorts.join(','));
		});
	});

	describe('goDownSort', () => {
		const { result: { current: urlQuery } } = renderHook(() =>
			useUrlQuery({
				sorts: ["asc", "desc", "name"]
			})
		);

		shouldReturnTrueWhenSuccessful(urlQuery.goDownSort('desc'));
		shouldReturnUndefinedWhenNotFound(urlQuery.goDownSort('not-found'));
	});

	describe('hasSort', () => {
		const { result: { current: urlQuery } } = renderHook(() =>
			useUrlQuery({
				sorts: ["asc", "desc", "name"]
			})
		);

		it('should return false if not found', () => {
			expect(urlQuery.hasSort('not-found')).toBe(false);
		});

		it('should return true if find', () => {
			expect(urlQuery.hasSort('desc')).toBe(true);
		});
	});

	describe('internalToggleSortState', () => {
		const { result: { current: urlQuery } } = renderHook(() =>
			useUrlQuery({
				sorts: ["asc", "desc"]
			})
		);

		it('should toggle include state', () => {
			const newSorts = urlQuery.internalToggleSortState(urlQuery.sorts, 'asc');

			const sort = newSorts.find(s => s.column === 'asc');

			expect(sort?.include).toBe(true);
		});

		it('should return true if successful', () => {
			expect(urlQuery.toggleDirectionSort('asc')).toBe(true);
		});

		shouldReturnUndefinedWhenNotFound(urlQuery.toggleDirectionSort('not-found'));
	});

	describe('toggleDirectionSort', () => {
		const { result: { current: urlQuery } } = renderHook(() =>
			useUrlQuery({
				sorts: ["asc", "desc"]
			})
		);

		urlQuery.toggleDirectionSort('desc');

		it('should toggle asc to desc', () => {
			urlQuery.toggleDirectionSort('asc');
			const sort = urlQuery.sorts.find(s => s.column === 'asc');
			expect(sort?.direction).toBe('-');
		});

		it('should toggle desc to asc', () => {
			urlQuery.toggleDirectionSort('desc');
			const sort = urlQuery.sorts.find(s => s.column === 'desc');
			expect(sort?.direction).toBe('');
		});

		it('should return true if successful', () => {
			expect(urlQuery.toggleDirectionSort('asc')).toBe(true);
		});

		shouldReturnUndefinedWhenNotFound(urlQuery.toggleDirectionSort('not-found'));
	});

	describe('sortIsAsc', () => {
		const { result: { current: urlQuery } } = renderHook(() =>
			useUrlQuery({
				sorts: ["asc", "desc"]
			})
		);

		urlQuery.toggleDirectionSort('desc');

		it('should return true is asc', () => {
			expect(urlQuery.sortIsAsc('asc')).toBe(true);
		});

		it('should return false is desc', () => {
			expect(urlQuery.sortIsAsc('desc')).toBe(false);
		});

		shouldReturnUndefinedWhenNotFound(urlQuery.sortIsAsc('not-found'));
	});

	describe('sortIsDesc', () => {
		const { result: { current: urlQuery } } = renderHook(() =>
			useUrlQuery({
				sorts: ["asc", "desc"]
			})
		);

		urlQuery.toggleDirectionSort('desc');

		it('should return false is asc', () => {
			expect(urlQuery.sortIsDesc('asc')).toBe(false);
		});

		it('should return true is desc', () => {
			expect(urlQuery.sortIsDesc('desc')).toBe(true);
		});

		shouldReturnUndefinedWhenNotFound(urlQuery.sortIsDesc('not-found'));
	});
})

describe('include', () => {
	describe('addInclude', () => {
		const { result: { current: urlQuery } } = renderHook(() =>
			useUrlQuery()
		);

		shouldReturnTrueWhenSuccessful(urlQuery.addInclude('desc'));
	});

	describe('remInclude', () => {
		const { result: { current: urlQuery } } = renderHook(() =>
			useUrlQuery()
		);

		shouldReturnTrueWhenSuccessful(urlQuery.remInclude('desc'));
	});
});

describe('page', () => {
	it.each([
		[null, null],
		[1, 1],
		[5, 5],
	])('when set page state as %i, page state should return "%s"', (page, state) => {
		const { result } = renderHook(() =>
			useUrlQuery()
		);

		act(() => {
			result.current.setPage(page);
		});

		expect(result.current.page).toBe(state);
	});

	it("remPage", () => {
		const { result } = renderHook(() =>
			useUrlQuery()
		);

		act(() => {
			result.current.remPage();
		});

		expect(result.current.page).toBe(null);
	});
});

describe('perPage', () => {
	it.each([
		[null, null],
		[10, 10],
		[25, 25],
	])('when set perPage state as %i, perPage state should return "%s"', (perPage, state) => {
		const { result } = renderHook(() =>
			useUrlQuery()
		);

		act(() => {
			result.current.setPerPage(perPage);
		});

		expect(result.current.perPage).toBe(state);
	});

	it("remPerPage", () => {
		const { result } = renderHook(() =>
			useUrlQuery()
		);

		act(() => {
			result.current.remPerPage();
		});

		expect(result.current.perPage).toBe(null);
	});
});

describe('query strings', () => {
	describe('sort', () => {
		const { result } = renderHook(() =>
			useUrlQuery({
				sorts: ["asc", "desc"]
			})
		);

		it('should return correct sort string', () => {
			act(() => {
				result.current.toggleSortState('asc');
				result.current.toggleSortState('desc');
			});
			expect(result.current.sortString).toBe('asc,desc');
		});

		it('should return correct sort query string', () => {
			act(() => {
				result.current.toggleSortState('asc');
				result.current.toggleSortState('desc');
			});
			expect(result.current.sortQueryString).toBe('sort=asc,desc');
		});
	});

	describe('include', () => {
		describe('addInclude', () => {
			it.each([
				['', ''],
				[['author'], 'author'],
				// [['author', 'comments'], 'author,comments'],
			])('when set includes state as %s, includeString should return "%s"', (includes, includeString) => {
				const { result } = renderHook(() =>
					useUrlQuery()
				);

				act(() => {
					result.current.addInclude(includes);
				});

				expect(result.current.includeString).toBe(includeString);
			})

			it.each([
				['', ''],
				[['author'], 'include=author'],
				[['author', 'comments'], 'include=author,comments'],
			])('when set includes state as %s, includeQueryString should return "%s"', (includes, includeQueryString) => {
				const { result } = renderHook(() =>
					useUrlQuery()
				);

				act(() => {
					result.current.addInclude(includes);
				});

				expect(result.current.includeQueryString).toBe(includeQueryString);
			})
		});

		describe.each([
			['', '', ''],
			[[''], ['one'], ''],
			[['one'], [''], 'one'],
			[['one', 'two', 'three'], ['one'], 'two,three'],
			[['one', 'two', 'three'], ['two'], 'one,three'],
			[['one', 'two', 'three'], ['three'], 'one,two'],
			[['one', 'two', 'three'], ['one', 'two', 'three'], ''],
		])('remInclude %s, %s', (initial, toRem, expected) => {
			const { result } = renderHook(() =>
				useUrlQuery()
			);

			act(() => {
				result.current.addInclude(initial);
			});

			act(() => {
				result.current.remInclude(toRem);
			});

			it('when set includes state as %s, includeString should return "%s"', () => {
				expect(result.current.includeString).toBe(expected);
			})

			it('when set includes state as %s, includeQueryString should return "%s"', () => {
				expect(result.current.includeQueryString).toBe(expected ? 'include=' + expected : expected);
			})
		});
	});

	describe('page', () => {
		describe('pageString', () => {
			it.each([
				[null, ''],
				[1, '1'],
				[5, '5'],
			])('page=%i should return string "%s"', (page, pageString) => {
				const { result } = renderHook(() =>
					useUrlQuery()
				);

				act(() => {
					result.current.setPage(page);
				});

				expect(result.current.pageString).toBe(pageString);
			});
		});

		describe('pageQueryString', () => {
			it.each([
				[null, ''],
				[1, 'page=1'],
				[5, 'page=5'],
			])('page=%i should return query string "%s"', (page, pageQueryString) => {
				const { result } = renderHook(() =>
					useUrlQuery()
				);

				act(() => {
					result.current.setPage(page);
				});

				expect(result.current.pageQueryString).toBe(pageQueryString);
			});
		});
	});

	describe('perPage', () => {
		describe('perPageString', () => {
			it.each([
				[null, ''],
				[10, '10'],
				[25, '25'],
			])('perPage=%i should return string "%s"', (perPage, perPageString) => {
				const { result } = renderHook(() =>
					useUrlQuery()
				);

				act(() => {
					result.current.setPerPage(perPage);
				});

				expect(result.current.perPageString).toBe(perPageString);
			});
		});

		describe('perPageQueryString', () => {
			it.each([
				[null, ''],
				[10, 'perPage=10'],
				[25, 'perPage=25'],
			])('perPage=%i should return query string "%s"', (perPage, perPageQueryString) => {
				const { result } = renderHook(() =>
					useUrlQuery()
				);

				act(() => {
					result.current.setPerPage(perPage);
				});

				expect(result.current.perPageQueryString).toBe(perPageQueryString);
			});
		});
	});

	describe('queryString', () => {
		const cases = subsets(['filter', 'sort', 'include', 'page', 'perPage']).map((subset): [string, string, string[]] => {
			let parts: string[] = []

			subset.forEach(element => {
				switch (element) {
					case 'filter':
						parts.push('filter[name]=jhon');
						break;
					case 'sort':
						parts.push('sort=name');
						break;
					case 'include':
						parts.push('include=author');
						break;
					case 'page':
						parts.push('page=2');
						break;
					case 'perPage':
						parts.push('perPage=25');
						break;
				}
			});

			const expectedQueryString = parts.length ? '?' + parts.join('&') : '';

			const subsetString = subset.join(',');
			return [subsetString, expectedQueryString, subset]
		});

		it.each([
			['', '', []],
			...cases
		])('when use "%s", should return %s', (_, expectedQueryString, subset) => {
			const { result } = renderHook(() =>
				useUrlQuery({
					sorts: ["name"],
				})
			);

			subset.forEach(element => {
				switch (element) {
					case 'filter':
						act(() => {
							result.current.filterBy('name', 'jhon');
						});
						break;
					case 'sort':
						act(() => {
							result.current.toggleSortState('name');
						});
						break;
					case 'include':
						act(() => {
							result.current.addInclude('author');
						});
						break;
					case 'page':
						act(() => {
							result.current.setPage(2);
						});
						break;
					case 'perPage':
						act(() => {
							result.current.setPerPage(25);
						});
						break;
				}
			});

			expect(result.current.queryString).toBe(expectedQueryString);
		});
	});
});

