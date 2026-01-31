import { Sort, SortParam, useUrlQuery } from "../src/use-url-query";
import { beforeEach, describe, expect, it, mock } from "bun:test";
import { renderHook, act } from "@testing-library/react";
import fastCartesian from 'fast-cartesian'
import { Permutation, PowerSet, } from 'js-combinatorics';
import z4, { object, property, z } from "zod/v4";
import { combinations, powerSet } from "../src/combine";

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

// TESTES FUTUROS
//E SE EU PASSAR FILTROS DUPLICADOS?
/**
Sctrutcure:
Params
	Sorts
	normalizeFromUrl
	filterSchema
		schemaToQueryString
		schema
		includeKey
		fieldsKey
Field
Filter
	filters
	filtersQueryString
	addFilter
	removeFilter
Include
	includes
	includeString
	includeQueryString
	addInclude
	removeInclude
Page
	page
	pageString
	pageQueryString
	removePage
PerPage
	perPage
	perPageString
	perPageQueryString
	removePerPage
Sort
	sorts
	sortString
	sortQueryString
	hasSort
	isSortAsc
	isSortDesc
	moveSortUp
	moveSortDown
	toggleSort
	toggleSortDirection
Query Strings
	queryString
*/

describe('params', () => {
	describe('sorts', () => {
		const cases: [SortParam, Sort[]][] = [
			[
				["asc", "desc"],
				[
					{ column: 'asc', label: 'asc', direction: '', include: false },
					{ column: 'desc', label: 'desc', direction: '', include: false }
				]
			],
			[
				[
					{ column: 'asc', label: 'Ascending' },
					{ column: 'desc', label: 'Descending' }
				],
				[
					{ column: 'asc', label: 'Ascending', direction: '', include: false },
					{ column: 'desc', label: 'Descending', direction: '', include: false }
				]
			]
		]
		it.each(cases)('should initialize sorts correctly', (inputSorts, expectedSorts) => {
			const { result } = renderHook(() =>
				useUrlQuery({
					sorts: inputSorts
				})
			);

			expect(result.current.sorts).toEqual(expectedSorts);
		});
	});

	describe('normalizeFromUrl', () => {
		describe('filters', () => {
			const filters = [
				['string', 'a'],
				['number', '1'],
				['boolean', 'true'],
				['array', 'a,b,c'],
				['null', '']
			]

			const cases: [string, string[][]][] = subsets(filters)
				.map((subset) => [subset.map(subsubset => subsubset.join('='))
					.join('&'), subset]);

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

			it('should return undefined when field is missing', () => {
				mockedSearchParams = new URLSearchParams('');

				const { result } = renderHook(() =>
					useUrlQuery({
						normalizeFromUrl: true,
						filterSchema: z4.object({
							number: z4.number(),
						})
					})
				);

				expect(result.current.filters.number).toEqual(undefined);
			})
		});

		describe('sorts', () => {
			const powerSets = [...new PowerSet('abcde')]

			const combinations: [string, string][][] = []

			powerSets.map((set, index) => {
				//FOR VOID CASE
				if (index === 0) {
					combinations.push([])
					return
				}

				//MAKE POSSIBLE DIRECTIONS
				const sortingsWithDirection = set.map(sorting => fastCartesian([['', '-'], [sorting]]))

				//MAKE COMBINATIONS sortingsWithDirectionA x sortingsWithDirectionB
				//EX: [[["", "a"], ["-", "a"]], [["", "b"], ["-", "b"]]] =>
				//[[["", "a"], ["", "b"]], [["", "a"], ["-", "b"]], [["-", "a"], ["", "b"]], [["-", "a"], ["-", "b"]]]
				const cartesian = fastCartesian(sortingsWithDirection);

				// PERMUTATION IS COMBINATIONS FOR ALL ORDERS
				//FOR EACH COMBINATION FROM sortingsWithDirectionA x sortingsWithDirectionB GENERATE COMBINATION WHERE ORDER MATTER
				//EX: [[ "", "a" ], [ "", "b" ]] => [[ "", "a" ], [ "", "b" ], [ "", "b" ], [ "", "a" ]]
				const permutation = cartesian.flatMap(group => {
					return [...new Permutation(group)]
				});

				combinations.push(...permutation)
			})

			const cases: [string, string[][]][] = combinations.map(combination => [
				combination.map((sortConfig => sortConfig.join(''))).join(),
				combination
			])

			it.each(cases)('when query string is %s', (queryString, sortings: string[][]) => {
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
					})
				});

				expect(result.current.sorts.filter(sort => sort.include)).toEqual(validSortings);
			})
		});
	});

	describe('fieldsSchema', () => {

	})

	describe('schemaToQueryString', () => {
		//TODO: FORNECER UM SCHEMA BASE, STRING E QUERY STRING PARA QUE PESSOAS QUE UTLIZEM A LIB POSSAM TESTAR MAIS FACILMENTE 
		//TODO: FORNECER TIPOS PARA QUE OUTRAS PESSOAS POSSAM ACOPLAR A FUNÇÃO MAIS FACILMENTE EM SEUS HOOK
		const schema = z4.object({
			propertyOne: z.string(),
			object: z.object({
				propertyOne: z.number()
			})
		})

		let expectedQueryString = ''

		beforeEach(() => {
			expectedQueryString = '??fields[root]=propertyOne&fields[object]=propertyOne&include=object'
		})

		it('should concatenate the converted schema', () => {
			const { result } = renderHook(() =>
				useUrlQuery({
					schemaToQueryString: {
						schema: schema,
						rootResource: 'root',
					}
				})
			);

			expect(result.current.queryString).toBe(expectedQueryString)
		})

		const cases = [
			[undefined, undefined],
			[undefined, "fieldsKey"],
			["includeKey", undefined],
			["includeKey", "fieldsKey"],
		]

		it.each(cases)('should repass keys %s and %s', (includeKey, fieldsKey) => {
			const { result } = renderHook(() =>
				useUrlQuery({
					schemaToQueryString: {
						schema: schema,
						rootResource: 'root',
						includeKey: includeKey,
						fieldsKey: fieldsKey
					}
				})
			);

			if (includeKey) {
				expectedQueryString = expectedQueryString.replaceAll("include", includeKey)
			}

			if (fieldsKey) {
				expectedQueryString = expectedQueryString.replaceAll("fields", fieldsKey)
			}

			expect(result.current.queryString).toBe(expectedQueryString)
		})
	})
});

describe("fields", () => {

})

describe("filters", () => {

})

describe('include', () => {
	describe('addInclude', () => {
		const { result: { current: urlQuery } } = renderHook(() =>
			useUrlQuery()
		);
	});

	describe('removeInclude', () => {
		const { result: { current: urlQuery } } = renderHook(() =>
			useUrlQuery()
		);
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

	it("removePage", () => {
		const { result } = renderHook(() =>
			useUrlQuery()
		);

		act(() => {
			result.current.removePage();
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

	it("removePerPage", () => {
		const { result } = renderHook(() =>
			useUrlQuery()
		);

		act(() => {
			result.current.removePerPage();
		});

		expect(result.current.perPage).toBe(null);
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
	])('moveSortUp %i, %i', (initialSorts, indexToMove, expectedSorts) => {
		const { result } = renderHook(() =>
			useUrlQuery({
				sorts: initialSorts
			})
		);

		act(() => {
			result.current.moveSortUp(initialSorts[indexToMove]);
		});

		act(() => {
			sorts.forEach(s => result.current.toggleSort(s));
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
	describe('moveSortUp', () => {
		const { result: { current: urlQuery } } = renderHook(() =>
			useUrlQuery({
				sorts: ["asc", "desc", "name"]
			})
		);
	});

	describe.each([
		[sorts, 0, ['2', '1', '3', '4', '5']],
		[sorts, 1, ['1', '3', '2', '4', '5']],
		[sorts, 2, ['1', '2', '4', '3', '5']],
		[sorts, 3, ['1', '2', '3', '5', '4']],
		[sorts, 4, ['1', '2', '3', '4', '5']],
	])('moveSortDown %i, %i', (initialSorts, indexToMove, expectedSorts) => {
		const { result } = renderHook(() =>
			useUrlQuery({
				sorts: initialSorts
			})
		);

		act(() => {
			result.current.moveSortDown(initialSorts[indexToMove]);
		});

		act(() => {
			sorts.forEach(s => result.current.toggleSort(s));
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

	describe('moveSortDown', () => {
		const { result: { current: urlQuery } } = renderHook(() =>
			useUrlQuery({
				sorts: ["asc", "desc", "name"]
			})
		);
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

	describe('toggleSort', () => {
		const { result: { current: urlQuery } } = renderHook(() =>
			useUrlQuery({
				sorts: ["asc", "desc"]
			})
		);

		it('should toggle include state', () => {
			act(() => {
				urlQuery.toggleSort('asc');
			})

			const sort = urlQuery.sorts.find(s => s.column === 'asc');

			expect(sort?.include).toBe(true);
		});
	});

	describe('toggleSortDirection', () => {
		const { result: { current: urlQuery } } = renderHook(() =>
			useUrlQuery({
				sorts: ["asc", "desc"]
			})
		);

		urlQuery.toggleSortDirection('desc');

		it('should toggle asc to desc', () => {
			urlQuery.toggleSortDirection('asc');
			const sort = urlQuery.sorts.find(s => s.column === 'asc');
			expect(sort?.direction).toBe('-');
		});

		it('should toggle desc to asc', () => {
			urlQuery.toggleSortDirection('desc');
			const sort = urlQuery.sorts.find(s => s.column === 'desc');
			expect(sort?.direction).toBe('');
		});
	});

	describe('isSortAsc', () => {
		const { result: { current: urlQuery } } = renderHook(() =>
			useUrlQuery({
				sorts: ["asc", "desc"]
			})
		);

		urlQuery.toggleSortDirection('desc');

		it('should return true is asc', () => {
			expect(urlQuery.isSortAsc('asc')).toBe(true);
		});

		it('should return false is desc', () => {
			expect(urlQuery.isSortAsc('desc')).toBe(false);
		});
	});

	describe('isSortDesc', () => {
		const { result: { current: urlQuery } } = renderHook(() =>
			useUrlQuery({
				sorts: ["asc", "desc"]
			})
		);

		urlQuery.toggleSortDirection('desc');

		it('should return false is asc', () => {
			expect(urlQuery.isSortDesc('asc')).toBe(false);
		});

		it('should return true is desc', () => {
			expect(urlQuery.isSortDesc('desc')).toBe(true);
		});
	});
})

describe('query strings', () => {
	describe('sort', () => {
		const { result } = renderHook(() =>
			useUrlQuery({
				sorts: ["asc", "desc"]
			})
		);

		it('should return correct sort string', () => {
			act(() => {
				result.current.toggleSort('asc');
				result.current.toggleSort('desc');
			});
			expect(result.current.sortString).toBe('asc,desc');
		});

		it('should return correct sort query string', () => {
			act(() => {
				result.current.toggleSort('asc');
				result.current.toggleSort('desc');
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
		])('removeInclude %s, %s', (initial, toRemove, expected) => {
			const { result } = renderHook(() =>
				useUrlQuery()
			);

			act(() => {
				result.current.addInclude(initial);
			});

			act(() => {
				result.current.removeInclude(toRemove);
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
							result.current.addFilter('name', 'jhon');
						});
						break;
					case 'sort':
						act(() => {
							result.current.toggleSort('name');
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

