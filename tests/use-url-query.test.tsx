import { useUrlQuery } from "../src/use-url-query";
import { describe, expect, it } from "bun:test";
import { renderHook, act } from "@testing-library/react";

describe('params', () => {
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
	describe('goUpSort', () => {
		const { result: { current: urlQuery } } = renderHook(() =>
			useUrlQuery({
				sorts: ["asc", "desc", "name"]
			})
		);

		it('should move sort up', async () => {
			const newSorts = urlQuery.internalGoUpSort(urlQuery.sorts, 1);
			expect(newSorts.map(s => s.column))
				.toEqual(["desc", "asc", "name"]);
		});

		it('should return undefined if not found', () => {
			expect(urlQuery.goUpSort('not-found')).toBe(undefined);
		});

		it('should return true if successful', () => {
			expect(urlQuery.goUpSort('desc')).toBe(true);
		});
	});

	describe('goDownSort', () => {
		const { result: { current: urlQuery } } = renderHook(() =>
			useUrlQuery({
				sorts: ["asc", "desc", "name"]
			})
		);

		it('should move sort down', async () => {
			const newSorts = urlQuery.internalGoDownSort(urlQuery.sorts, 1);
			expect(newSorts.map(s => s.column))
				.toEqual(["asc", "name", "desc"]);
		});

		it('should return undefined if not found', () => {
			expect(urlQuery.goDownSort('not-found')).toBe(undefined);
		});

		it('should return true if successful', () => {
			expect(urlQuery.goDownSort('desc')).toBe(true);
		});
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

		it('should return undefined if not found', () => {
			expect(urlQuery.toggleDirectionSort('not-found')).toBe(undefined);
		});

		it('should return true if successful', () => {
			expect(urlQuery.toggleDirectionSort('asc')).toBe(true);
		});
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

		it('should return undefined if not found', () => {
			expect(urlQuery.toggleDirectionSort('not-found')).toBe(undefined);
		});

		it('should return true if successful', () => {
			expect(urlQuery.toggleDirectionSort('asc')).toBe(true);
		});
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

		it('should return undefined if not found', () => {
			expect(urlQuery.sortIsAsc('not-found')).toBe(undefined);
		});
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

		it('should return undefined if not found', () => {
			expect(urlQuery.sortIsDesc('not-found')).toBe(undefined);
		});
	});
})

describe('page', () => {
	it.each([
		[null, null],
		[1, 1],
		[5, 5],
	])('when set page state as %i, page state should return "%s"', (page, state) => {
		const { result } = renderHook(() =>
			useUrlQuery({})
		);

		act(() => {
			result.current.setPage(page);
		});

		expect(result.current.page).toBe(state);
	});

	it("remPage", () => {
		const { result } = renderHook(() =>
			useUrlQuery({})
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
			useUrlQuery({})
		);

		act(() => {
			result.current.setPerPage(perPage);
		});

		expect(result.current.perPage).toBe(state);
	});

	it("remPerPage", () => {
		const { result } = renderHook(() =>
			useUrlQuery({})
		);

		act(() => {
			result.current.remPerPage();
		});

		expect(result.current.perPage).toBe(null);
	});
});

describe('query strings', () => {
	describe('sort', () => {
		const { result: { current: urlQuery } } = renderHook(() =>
			useUrlQuery({
				sorts: ["asc", "desc"]
			})
		);

		it('should return correct sort string', () => {
			expect(urlQuery.sortString).toBe('asc,desc');
		});

		it('should return correct sort query string', () => {
			expect(urlQuery.sortQueryString).toBe('sort=asc,desc');
		});

		it('should return correct query string', () => {
			expect(urlQuery.queryString).toBe('?sort=asc,desc');
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
					useUrlQuery({})
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
					useUrlQuery({})
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
					useUrlQuery({})
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
					useUrlQuery({})
				);

				act(() => {
					result.current.setPerPage(perPage);
				});

				expect(result.current.perPageQueryString).toBe(perPageQueryString);
			});
		});
	});
});