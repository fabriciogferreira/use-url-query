import { resetNextNavigationMock } from './helpers/mock-next-navigation'
import { act, renderHook } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'
import {
	addIncludeValue,
	buildIncludesQueryString,
	clearIncludeValue,
	parseIncludesFromSearchParams,
	removeIncludeValue,
	setIncludeValue,
} from '../src/includes'
import { useUrlQuery } from '../src/use-url-query'

describe('includes (pure)', () => {
	describe('buildIncludesQueryString', () => {
		it('returns empty string when includes is empty', () => {
			expect(buildIncludesQueryString([], 'include')).toBe('')
		})

		it('returns include=posts,permissions', () => {
			expect(
				buildIncludesQueryString(['posts', 'permissions'], 'include'),
			).toBe('include=posts,permissions')
		})
	})

	describe('parseIncludesFromSearchParams', () => {
		it('returns [] when searchParams is missing', () => {
			expect(parseIncludesFromSearchParams(undefined, 'include')).toEqual(
				[],
			)
			expect(parseIncludesFromSearchParams(null, 'include')).toEqual([])
		})

		it('parses a comma-separated include param', () => {
			expect(
				parseIncludesFromSearchParams(
					new URLSearchParams('include=posts,permissions'),
					'include',
				),
			).toEqual(['posts', 'permissions'])
		})

		it('ignores unrelated params', () => {
			expect(
				parseIncludesFromSearchParams(
					new URLSearchParams('sort=name&filter[name]=a'),
					'include',
				),
			).toEqual([])
		})

		it('trims and drops empty tokens', () => {
			expect(
				parseIncludesFromSearchParams(
					new URLSearchParams('include=posts,, permissions,'),
					'include',
				),
			).toEqual(['posts', 'permissions'])
		})
	})

	describe('addIncludeValue / removeIncludeValue / set / clear', () => {
		it('adds includes and dedupes while preserving order', () => {
			const once = addIncludeValue([], 'posts')
			expect(once).toEqual(['posts'])

			const twice = addIncludeValue(once, ['posts', 'permissions'])
			expect(twice).toEqual(['posts', 'permissions'])
		})

		it('setIncludeValue replaces the whole list', () => {
			expect(setIncludeValue(['posts'], ['permissions'])).toEqual([
				'permissions',
			])
		})

		it('clearIncludeValue empties the list', () => {
			expect(clearIncludeValue(['posts', 'permissions'])).toEqual([])
		})

		it('removes specific includes', () => {
			expect(
				removeIncludeValue(['posts', 'permissions'], 'posts'),
			).toEqual(['permissions'])
			expect(
				removeIncludeValue(
					['posts', 'permissions'],
					['posts', 'permissions'],
				),
			).toEqual([])
		})
	})
})

const includeParamCases = [[undefined], ['relations']] as const

describe.each(includeParamCases)('include (useUrlQuery)', (includeParam) => {
	const includeParamName = () => (includeParam ? includeParam : 'include')

	beforeEach(() => {
		resetNextNavigationMock()
	})

	describe('addInclude merges', () => {
		it('should produce ?include=posts,permissions across calls', () => {
			const { result } = renderHook(() =>
				useUrlQuery({
					includeParamAs: includeParam,
					normalizeFromUrl: false,
				}),
			)

			act(() => {
				result.current.addInclude('posts')
			})
			act(() => {
				result.current.addInclude('permissions')
			})

			expect(result.current.includes).toEqual(['posts', 'permissions'])
			expect(result.current.includeQueryString).toBe(
				`${includeParamName()}=posts,permissions`,
			)
		})
	})

	describe('setIncludes / clearIncludes', () => {
		it('setIncludes replaces and clearIncludes empties', () => {
			const { result } = renderHook(() =>
				useUrlQuery({
					includeParamAs: includeParam,
					normalizeFromUrl: false,
				}),
			)

			act(() => {
				result.current.setIncludes(['posts', 'permissions'])
			})
			expect(result.current.includeQueryString).toBe(
				`${includeParamName()}=posts,permissions`,
			)

			act(() => {
				result.current.clearIncludes()
			})
			expect(result.current.includes).toEqual([])
			expect(result.current.includeQueryString).toBe('')
		})
	})

	describe('normalizeFromUrl', () => {
		it('should parse includes from the URL', () => {
			resetNextNavigationMock(
				new URLSearchParams(
					`${includeParamName()}=posts,permissions`,
				),
			)

			const { result } = renderHook(() =>
				useUrlQuery({
					normalizeFromUrl: true,
					includeParamAs: includeParam,
				}),
			)

			expect(result.current.includes).toEqual(['posts', 'permissions'])
		})
	})
})
