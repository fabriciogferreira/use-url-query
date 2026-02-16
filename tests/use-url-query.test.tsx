import { Sort, SortParam, useUrlQuery } from "../src/use-url-query";
import { afterEach, beforeEach, describe, expect, it, mock, jest } from "bun:test";
import { renderHook, act } from "@testing-library/react";
import fastCartesian from 'fast-cartesian'
import { Permutation, PowerSet, } from 'js-combinatorics';
import { powerSet } from "../src/combine";
import { schemaForTest, expectedQueryStringForTest } from "@fabriciogferreira/schema-to-query-string";
import { parseAsArrayOf, parseAsBoolean, parseAsInteger, parseAsString } from "nuqs";

let mockedSearchParams: URLSearchParams;
let pushSpy: ReturnType<typeof mock>

pushSpy = mock(() => { })

mock.module("next/navigation", () => ({
	useSearchParams: () => mockedSearchParams,
}));

mock.module('next/navigation', () => ({
	useRouter: () => ({
		push: pushSpy,
	}),
}))


// TESTES FUTUROS
//E SE EU PASSAR FILTROS DUPLICADOS?
/**
Sctrutcure:
Field
Filter
	filterSchema
		schemaToQueryString
		schema
		includeKey
		fieldsKey
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
	Sorts
	normalizeFromUrl
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

describe("fields", () => {

})

const filterCases = [
	[undefined],
	["relations"]
] as const
describe.each(filterCases)("filter", (filterParam) => {
	const filterParamFn = () => filterParam ? filterParam : 'filter'

	describe('normalizeFromUrl', () => {
		describe('filters', () => {
			const filters = [
				['string', 'a', 'a'],
				['number', '1', 1],
				['boolean', 'true', true],
				['array', 'a,b,c', ['a', 'b', 'c']],
				['null', '', '']
			]

			const cases: [string, unknown[][]][] = powerSet(filters)
				.map((subset) => [subset.map(subsubset => subsubset.join('='))
					.join('&'), subset]);

			it.each(cases)('when query string is %s', (_, params: unknown[][]) => {
				const queryString = params.map(([key, value]) => filterParamFn() + `[${key}]=${value}`).join('&');

				mockedSearchParams = new URLSearchParams(queryString);

				let expectedFilters: Record<string, unknown> = {};

				params.forEach(([key, value, expect]) => {
					// @ts-expect-error 
					expectedFilters[key] = expect;
				})

				const { result } = renderHook(() =>
					useUrlQuery({
						normalizeFromUrl: true,
						filters: {
							string: parseAsString,
							number: parseAsInteger,
							boolean: parseAsBoolean,
							array: parseAsArrayOf(parseAsString),
							null: parseAsString
						},
						filterParamAs: filterParam
					})
				);

				expect(result.current.filters).toEqual(expectedFilters);
			})

			it('should return undefined when filter is missing', () => {
				mockedSearchParams = new URLSearchParams('');

				const { result } = renderHook(() =>
					useUrlQuery({
						normalizeFromUrl: true,
						filters: {
							number: parseAsInteger
						},
						filterParamAs: filterParam
					})
				);

				expect(result.current.filters.number).toEqual(undefined);
			})
		});
	});

	describe('addFilterDebounced', () => {
		beforeEach(() => {
			jest.useFakeTimers()
		})

		afterEach(() => {
			jest.useRealTimers()
		})

		it('should add filter after timeout', () => {
			const { result } = renderHook(() => useUrlQuery({
				filterParamAs: filterParam
			}))

			act(() => {
				result.current.addFilterDebounced('name', 'John', 400)
			})

			expect(result.current.filters).toEqual({})

			act(() => {
				jest.advanceTimersByTime(400)
			})

			expect(result.current.filters).toEqual({
				name: 'John'
			})
		})

		it('should apply last call', async () => {
			const { result } = renderHook(() => useUrlQuery({
				filterParamAs: filterParam
			}))

			act(() => {
				result.current.addFilterDebounced('name', 'J', 200)
				result.current.addFilterDebounced('name', 'Jo', 500)
				result.current.addFilterDebounced('name', 'John', 300)
			})

			expect(result.current.filters).toEqual({})

			act(() => {
				jest.advanceTimersByTime(500)
			})

			expect(result.current.filters).toEqual({
				name: 'John'
			})
		});

		it('should have 300ms default timeout', () => {
			//TODO: TESTE QUEBRA SE FOR MENOR QUE 300MS
			const { result } = renderHook(() => useUrlQuery({
				filterParamAs: filterParam
			}))

			act(() => {
				result.current.addFilterDebounced('name', 'John')
			})

			expect(result.current.filters).toEqual({})

			act(() => {
				jest.advanceTimersByTime(300)
			})

			expect(result.current.filters).toEqual({
				name: 'John'
			})
		});
	});
})

const includeCases = [
	[undefined],
	["relations"]
] as const

describe.each(includeCases)('include', (includeParam) => {
	const includeParamFn = () => includeParam ? includeParam : 'include'

	describe('addInclude', () => {
		it.each([
			['', ''],
			[['author'], 'author'],
			// [['author', 'comments'], 'author,comments'],
		])('when set includes state as %s, includeString should return "%s"', (includes, includeString) => {
			const { result } = renderHook(() =>
				useUrlQuery({
					includeParamAs: includeParam
				})
			);

			act(() => {
				result.current.addInclude(includes);
			});

			expect(result.current.includeString).toBe(includeString);
		})

		it.each([
			['', ''],
			[['author'], includeParamFn() + '=author'],
			[['author', 'comments'], includeParamFn() + '=author,comments'],
		])('when set includes state as %s, includeQueryString should return "%s"', (includes, includeQueryString) => {
			const { result } = renderHook(() =>
				useUrlQuery({
					includeParamAs: includeParam
				})
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
			useUrlQuery({
				includeParamAs: includeParam
			})
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
			expect(result.current.includeQueryString).toBe(expected ? includeParamFn() + '=' + expected : expected);
		})
	});
});

describe('page', () => {
	describe.each([
		[null],
		[1],
		[5],
	])('setPage', (page) => {
		const { result } = renderHook(() =>
			useUrlQuery()
		);

		act(() => {
			result.current.setPage(page);
		});

		it('state should return "%s"', () => {
			expect(result.current.page).toBe(page);
		});

		it('pageString page=%i should return string "%s"', () => {
			expect(result.current.pageString).toBe(page ? page.toString() : '');
		});

		it('pageQueryString page=%i should return query string "%s"', () => {
			expect(result.current.pageQueryString).toBe(page ? 'page=' + page : '');
		});
	})

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
	describe.each([
		[null],
		[10],
		[25],
	])("setPerPage", (perPage) => {
		const { result } = renderHook(() =>
			useUrlQuery()
		);

		act(() => {
			result.current.setPerPage(perPage);
		});

		it('perPage state should return ' + perPage, () => {
			expect(result.current.perPage).toBe(perPage);
		});

		it('perPageString should return string ' + perPage, () => {
			expect(result.current.perPageString).toBe(perPage ? perPage.toString() : '');
		});

		it('perPageQueryString should return query string perPage=' + perPage, () => {
			expect(result.current.perPageQueryString).toBe(perPage ? 'perPage=' + perPage : '');
		});
	})

	describe("removePerPage", () => {
		const { result } = renderHook(() =>
			useUrlQuery()
		);

		act(() => {
			result.current.removePerPage();
		});

		it('perPage state should return ' + null, () => {
			expect(result.current.perPage).toBe(null);
		});

		it('perPageString should return string', () => {
			expect(result.current.perPageString).toBe('');
		});

		it('perPageQueryString should return query string', () => {
			expect(result.current.perPageQueryString).toBe('');
		});

		expect(result.current.perPage).toBe(null);
	});
});


const sortCases = [
	[undefined],
	["order"]
] as const

describe.each(sortCases)('sort', (sortParam) => {
	const sortParamFn = () => sortParam ? sortParam : 'sort'

	describe('param', () => {
		const cases1: [SortParam, Sort[]][] = [
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
		it.each(cases1)('should initialize sorts correctly', (inputSorts, expectedSorts) => {
			const { result } = renderHook(() =>
				useUrlQuery({
					sorts: inputSorts,
					sortParamAs: sortParam
				})
			);

			expect(result.current.sorts).toEqual(expectedSorts);
		});
	})

	describe('normalize from url', () => {
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
			mockedSearchParams = new URLSearchParams(sortParamFn() + `=${queryString}`);

			const sorts: Record<string, string> = {};

			sortings.flatMap(sort => {
				if (["a", "b", "c"].includes(sort[1])) {
					sorts[sort[1]] = sort[0];
				}
			});

			const { result } = renderHook(() =>
				useUrlQuery({
					normalizeFromUrl: true,
					sorts: ["a", "b", "c"],
					sortParamAs: sortParam
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
	})

	describe('state', () => {
		const { result } = renderHook(() =>
			useUrlQuery({
				sorts: ["asc", "desc"],
				sortParamAs: sortParam
			})
		);

		act(() => {
			result.current.toggleSort('asc');
			result.current.toggleSort('desc');
		});

		it('should return correct sort string', () => {
			expect(result.current.sortString).toBe('asc,desc');
		});

		it('should return correct sort query string', () => {
			expect(result.current.sortQueryString).toBe(sortParamFn() + '=asc,desc');
		});
	})

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
				sorts: initialSorts,
				sortParamAs: sortParam,
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
			expect(result.current.sortQueryString).toBe(sortParamFn() + '=' + expectedSorts.join(','));
		});
	});
	describe('moveSortUp', () => {
		const { result: { current: urlQuery } } = renderHook(() =>
			useUrlQuery({
				sortParamAs: sortParam,
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
				sortParamAs: sortParam,
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
			expect(result.current.sortQueryString).toBe(sortParamFn() + '=' + expectedSorts.join(','));
		});
	});

	describe('moveSortDown', () => {
		const { result: { current: urlQuery } } = renderHook(() =>
			useUrlQuery({
				sortParamAs: sortParam,
				sorts: ["asc", "desc", "name"]
			})
		);
	});

	describe('hasSort', () => {
		const { result: { current: urlQuery } } = renderHook(() =>
			useUrlQuery({
				sortParamAs: sortParam,
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
				sortParamAs: sortParam,
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
				sortParamAs: sortParam,
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
				sortParamAs: sortParam,
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
				sortParamAs: sortParam,
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

describe('query string', () => {
	describe('state', () => {
		const cases = powerSet(['filter', 'sort', 'include', 'page', 'perPage']).map((subset): [string, string, string[]] => {
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
					filters: {
						name: parseAsString
					}
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

	describe('schemaToQueryString', () => {
		let expectedQueryString = ''

		beforeEach(() => {
			expectedQueryString = expectedQueryStringForTest
		})

		it('should concatenate the converted schema', () => {
			const { result } = renderHook(() =>
				useUrlQuery({
					schemaToQueryString: {
						schema: schemaForTest,
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
						schema: schemaForTest,
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

	describe('isUpdateUrl', () => {
		mockedSearchParams = new URLSearchParams('')

		const { result } = renderHook(() =>
			useUrlQuery({ normalizeFromUrl: true })
		)

		act(() => {
			result.current.addInclude(['include1', 'include2'])
		})

		it('expect push have been called', () => {
			expect(pushSpy).toHaveBeenCalled()
		})

		it('expect push have been called with correct string', () => {
			expect(pushSpy).toHaveBeenCalledWith(
				expect.stringContaining('include=include1,include2')
			)
		})
	})
});

