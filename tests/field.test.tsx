import { resetNextNavigationMock } from './helpers/mock-next-navigation'
import { beforeEach, describe, expect, it } from 'vitest'
import { act, renderHook } from '@testing-library/react'
import {
	addFieldValue,
	buildFieldsQueryString,
	parseFieldsFromSearchParams,
	removeFieldValue,
} from '../src/fields'
import { useUrlQuery } from '../src/use-url-query'

describe('fields (pure)', () => {
	describe('buildFieldsQueryString', () => {
		it('returns empty string when fields is empty', () => {
			expect(buildFieldsQueryString({}, 'fields')).toBe('')
		})

		it('returns fields[users]=id,name', () => {
			expect(
				buildFieldsQueryString(
					{ users: ['id', 'name'] },
					'fields',
				),
			).toBe('fields[users]=id,name')
		})

		it('skips resources with an empty list', () => {
			expect(
				buildFieldsQueryString(
					{ users: [], posts: ['title'] },
					'fields',
				),
			).toBe('fields[posts]=title')
		})

		it('joins multiple resources with &', () => {
			expect(
				buildFieldsQueryString(
					{ users: ['id'], posts: ['title'] },
					'fields',
				),
			).toBe('fields[users]=id&fields[posts]=title')
		})

		it('respects custom field param name', () => {
			expect(
				buildFieldsQueryString(
					{ users: ['id'] },
					'select',
				),
			).toBe('select[users]=id')
		})
	})

	describe('parseFieldsFromSearchParams', () => {
		it('returns empty object when searchParams is missing', () => {
			expect(parseFieldsFromSearchParams(null, 'fields')).toEqual({})
			expect(
				parseFieldsFromSearchParams(undefined, 'fields'),
			).toEqual({})
		})

		it('parses present field params', () => {
			expect(
				parseFieldsFromSearchParams(
					new URLSearchParams(
						'fields[users]=id,name&fields[posts]=title',
					),
					'fields',
				),
			).toEqual({
				users: ['id', 'name'],
				posts: ['title'],
			})
		})

		it('ignores unrelated params and empty resource keys', () => {
			expect(
				parseFieldsFromSearchParams(
					new URLSearchParams(
						'filter[name]=a&fields[]=id&fields[users]=id',
					),
					'fields',
				),
			).toEqual({ users: ['id'] })
		})

		it('trims and drops empty field tokens', () => {
			expect(
				parseFieldsFromSearchParams(
					new URLSearchParams('fields[users]=id,, name,'),
					'fields',
				),
			).toEqual({ users: ['id', 'name'] })
		})

		it('skips a resource whose value is only empty tokens', () => {
			expect(
				parseFieldsFromSearchParams(
					new URLSearchParams('fields[users]=,,,  ,'),
					'fields',
				),
			).toEqual({})
		})
	})

	describe('addFieldValue / removeFieldValue', () => {
		it('adds fields and dedupes', () => {
			const once = addFieldValue({}, 'users', 'id')
			expect(once).toEqual({ users: ['id'] })

			const twice = addFieldValue(once, 'users', ['id', 'name'])
			expect(twice).toEqual({ users: ['id', 'name'] })
		})

		it('keeps sibling resources when adding', () => {
			expect(
				addFieldValue({ posts: ['title'] }, 'users', 'id'),
			).toEqual({
				posts: ['title'],
				users: ['id'],
			})
		})

		it('ignores empty resource or empty field list', () => {
			expect(addFieldValue({}, '', 'id')).toEqual({})
			expect(addFieldValue({}, 'users', [])).toEqual({})
			expect(addFieldValue({}, 'users', '  ')).toEqual({})
		})

		it('removes specific fields and drops empty resources', () => {
			expect(
				removeFieldValue(
					{ users: ['id', 'name'] },
					'users',
					'id',
				),
			).toEqual({ users: ['name'] })

			expect(
				removeFieldValue(
					{ users: ['id'] },
					'users',
					['id'],
				),
			).toEqual({})

			expect(
				removeFieldValue(
					{ users: ['id'], posts: ['title'] },
					'users',
					'id',
				),
			).toEqual({ posts: ['title'] })
		})
		it('removes the whole resource when fields are omitted', () => {
			expect(
				removeFieldValue(
					{ users: ['id'], posts: ['title'] },
					'users',
				),
			).toEqual({ posts: ['title'] })
		})

		it('is a no-op for unknown resources', () => {
			const prev = { users: ['id'] }
			expect(removeFieldValue(prev, 'posts', 'id')).toBe(prev)
			expect(removeFieldValue(prev, 'posts')).toBe(prev)
		})

		it('treats a present resource with a missing list as empty', () => {
			const prev = {
				users: undefined as unknown as string[],
			}
			expect(removeFieldValue(prev, 'users', 'id')).toEqual({})
		})
	})
})

const fieldParamCases = [[undefined], ['select']] as const

describe.each(fieldParamCases)('field (useUrlQuery)', (fieldParam) => {
	const fieldParamName = () => (fieldParam ? fieldParam : 'fields')

	beforeEach(() => {
		resetNextNavigationMock()
	})

	describe('addField', () => {
		it('should produce ?fields[users]=id,name', () => {
			const { result } = renderHook(() =>
				useUrlQuery({
					fieldParamAs: fieldParam,
				}),
			)

			act(() => {
				result.current.addField('users', ['id', 'name'])
			})

			expect(result.current.fields).toEqual({
				users: ['id', 'name'],
			})
			expect(result.current.fieldsQueryString).toBe(
				`${fieldParamName()}[users]=id,name`,
			)
			expect(result.current.queryString).toBe(
				`?${fieldParamName()}[users]=id,name`,
			)
		})

		it('should merge fields for the same resource', () => {
			const { result } = renderHook(() =>
				useUrlQuery({
					fieldParamAs: fieldParam,
				}),
			)

			act(() => {
				result.current.addField('users', 'id')
			})
			act(() => {
				result.current.addField('users', 'name')
			})

			expect(result.current.fields).toEqual({
				users: ['id', 'name'],
			})
		})

		it('should keep sibling resources', () => {
			const { result } = renderHook(() =>
				useUrlQuery({
					fieldParamAs: fieldParam,
				}),
			)

			act(() => {
				result.current.addField('users', 'id')
				result.current.addField('posts', 'title')
			})

			expect(result.current.fieldsQueryString).toBe(
				`${fieldParamName()}[users]=id&${fieldParamName()}[posts]=title`,
			)
		})
	})

	describe('removeField', () => {
		it('should remove a single field', () => {
			const { result } = renderHook(() =>
				useUrlQuery({
					fieldParamAs: fieldParam,
				}),
			)

			act(() => {
				result.current.addField('users', ['id', 'name'])
			})
			act(() => {
				result.current.removeField('users', 'id')
			})

			expect(result.current.fields).toEqual({ users: ['name'] })
			expect(result.current.fieldsQueryString).toBe(
				`${fieldParamName()}[users]=name`,
			)
		})

		it('should clear the resource when fields are omitted', () => {
			const { result } = renderHook(() =>
				useUrlQuery({
					fieldParamAs: fieldParam,
				}),
			)

			act(() => {
				result.current.addField('users', ['id', 'name'])
				result.current.addField('posts', 'title')
			})
			act(() => {
				result.current.removeField('users')
			})

			expect(result.current.fields).toEqual({ posts: ['title'] })
			expect(result.current.queryString).toBe(
				`?${fieldParamName()}[posts]=title`,
			)
		})
	})

	describe('normalizeFromUrl', () => {
		it('should parse fields from the URL', () => {
			resetNextNavigationMock(
				new URLSearchParams(
					`${fieldParamName()}[users]=id,name&${fieldParamName()}[posts]=title`,
				),
			)

			const { result } = renderHook(() =>
				useUrlQuery({
					normalizeFromUrl: true,
					fieldParamAs: fieldParam,
				}),
			)

			expect(result.current.fields).toEqual({
				users: ['id', 'name'],
				posts: ['title'],
			})
		})
	})
})
