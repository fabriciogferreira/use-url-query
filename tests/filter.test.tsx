import { resetNextNavigationMock } from './helpers/mock-next-navigation'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { act, renderHook } from '@testing-library/react'
import { parseAsInteger, parseAsString } from 'nuqs'
import {
	addFilterValue,
	buildFiltersQueryString,
	parseFiltersFromSearchParams,
	removeFilterValue,
} from '../src/filters'
import { useUrlQuery } from '../src/use-url-query'

const filtersConfig = {
	key: parseAsString,
	page: parseAsInteger,
} as const

describe('filters (pure)', () => {
	describe('buildFiltersQueryString', () => {
		it('returns empty string when allowedFilters is undefined', () => {
			expect(buildFiltersQueryString(undefined, {}, 'filter')).toBe('')
		})

		it('returns filter[key]=value', () => {
			expect(
				buildFiltersQueryString(
					filtersConfig,
					{ key: 'value' },
					'filter',
				),
			).toBe('filter[key]=value')
		})

		it('replaces by key (object map — one entry per key)', () => {
			expect(
				buildFiltersQueryString(
					filtersConfig,
					{ key: 'valuesubstituido' },
					'filter',
				),
			).toBe('filter[key]=valuesubstituido')
		})

		it('skips falsy filter values', () => {
			expect(
				buildFiltersQueryString(
					filtersConfig,
					{ key: '' },
					'filter',
				),
			).toBe('')
		})

		it('joins multiple filters with &', () => {
			expect(
				buildFiltersQueryString(
					filtersConfig,
					{ key: 'a', page: 2 },
					'filter',
				),
			).toBe('filter[key]=a&filter[page]=2')
		})

		it('respects custom filter param name', () => {
			expect(
				buildFiltersQueryString(
					filtersConfig,
					{ key: 'value' },
					'relations',
				),
			).toBe('relations[key]=value')
		})
	})

	describe('parseFiltersFromSearchParams', () => {
		it('returns empty object when searchParams is missing', () => {
			expect(
				parseFiltersFromSearchParams(null, filtersConfig, 'filter'),
			).toEqual({})
			expect(
				parseFiltersFromSearchParams(
					undefined,
					filtersConfig,
					'filter',
				),
			).toEqual({})
		})

		it('returns empty object when allowedFilters is undefined', () => {
			expect(
				parseFiltersFromSearchParams(
					new URLSearchParams('filter[key]=value'),
					undefined,
					'filter',
				),
			).toEqual({})
		})

		it('skips keys whose param is null', () => {
			expect(
				parseFiltersFromSearchParams(
					new URLSearchParams(''),
					filtersConfig,
					'filter',
				),
			).toEqual({})
		})

		it('parses present filter params', () => {
			expect(
				parseFiltersFromSearchParams(
					new URLSearchParams('filter[key]=Alice&filter[page]=3'),
					filtersConfig,
					'filter',
				),
			).toEqual({ key: 'Alice', page: 3 })
		})
	})

	describe('addFilterValue / removeFilterValue', () => {
		it('adds and replaces the same key', () => {
			const once = addFilterValue({}, 'key', 'value')
			expect(once).toEqual({ key: 'value' })

			const twice = addFilterValue(once, 'key', 'valuesubstituido')
			expect(twice).toEqual({ key: 'valuesubstituido' })
		})

		it('removes a key', () => {
			expect(removeFilterValue({ key: 'value' }, 'key')).toEqual({})
		})
	})
})

describe('filter (useUrlQuery)', () => {
	beforeEach(() => {
		resetNextNavigationMock()
	})

	describe('addFilter', () => {
		it('should produce ?filter[key]=value', () => {
			const { result } = renderHook(() =>
				useUrlQuery({
					filters: {
						key: parseAsString,
					},
				}),
			)

			act(() => {
				result.current.addFilter('key', 'value')
			})

			expect(result.current.queryString).toBe('?filter[key]=value')
		})

		it('should replace value when the same key is added twice', () => {
			const { result } = renderHook(() =>
				useUrlQuery({
					filters: {
						key: parseAsString,
					},
				}),
			)

			act(() => {
				result.current.addFilter('key', 'value')
			})

			act(() => {
				result.current.addFilter('key', 'valuesubstituido')
			})

			expect(result.current.queryString).toBe(
				'?filter[key]=valuesubstituido',
			)
			expect(result.current.queryString).not.toBe(
				'?filter[key]=value&filter[key]=valuesubstituido',
			)
		})

		it('should respect filterParamAs', () => {
			const { result } = renderHook(() =>
				useUrlQuery({
					filters: {
						key: parseAsString,
					},
					filterParamAs: 'relations',
				}),
			)

			act(() => {
				result.current.addFilter('key', 'value')
			})

			expect(result.current.queryString).toBe('?relations[key]=value')
		})
	})

	describe('removeFilter', () => {
		it('should produce empty query string', () => {
			const { result } = renderHook(() =>
				useUrlQuery({
					filters: {
						key: parseAsString,
					},
				}),
			)

			act(() => {
				result.current.addFilter('key', 'value')
			})

			expect(result.current.queryString).toBe('?filter[key]=value')

			act(() => {
				result.current.removeFilter('key', null)
			})

			expect(result.current.queryString).toBe('')
		})
	})

	describe('addFilterDebounced', () => {
		beforeEach(() => {
			vi.useFakeTimers()
		})

		afterEach(() => {
			vi.useRealTimers()
		})

		it('applies the filter after the timeout', () => {
			const { result } = renderHook(() =>
				useUrlQuery({
					filters: {
						key: parseAsString,
					},
				}),
			)

			act(() => {
				result.current.addFilterDebounced('key', 'value', 400)
			})

			expect(result.current.filters).toEqual({})

			act(() => {
				vi.advanceTimersByTime(400)
			})

			expect(result.current.queryString).toBe('?filter[key]=value')
		})
	})

	describe('normalizeFromUrl', () => {
		it('loads filters from the URL', () => {
			resetNextNavigationMock(
				new URLSearchParams('filter[key]=from-url'),
			)

			const { result } = renderHook(() =>
				useUrlQuery({
					normalizeFromUrl: true,
					filters: {
						key: parseAsString,
					},
				}),
			)

			expect(result.current.filters).toEqual({ key: 'from-url' })
		})
	})
})
