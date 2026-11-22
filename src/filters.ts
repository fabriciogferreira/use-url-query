import { SingleParserBuilder } from 'nuqs'

export type InferParser<P> =
	P extends SingleParserBuilder<infer T> ? T : number

export type FiltersConfig = Record<string, SingleParserBuilder<any>>

export type FiltersFromConfig<C extends FiltersConfig> = {
	[K in keyof C]?: InferParser<C[K]>
}

/** Spatie-style `filter[key]=value` (joined with `&`). */
export function buildFiltersQueryString<C extends FiltersConfig>(
	allowedFilters: C | undefined,
	filters: FiltersFromConfig<C>,
	filterParam: string,
): string {
	if (allowedFilters === undefined) {
		return ''
	}

	return Object.entries(allowedFilters)
		.filter(([key]) => filters[key])
		.map(([key, parser]) => {
			return (
				filterParam + `[${key}]=${parser.serialize(filters[key])}`
			)
		})
		.join('&')
}

/** Read allowed filters from the current URL search params. */
export function parseFiltersFromSearchParams<C extends FiltersConfig>(
	searchParams: { get(name: string): string | null } | undefined | null,
	allowedFilters: C | undefined,
	filterParam: string,
): FiltersFromConfig<C> {
	const newFilters: FiltersFromConfig<C> = {}

	if (!searchParams || allowedFilters === undefined) {
		return newFilters
	}

	for (const key in allowedFilters) {
		const paramValue = searchParams.get(filterParam + `[${key}]`)
		const parser = allowedFilters[key]

		if (paramValue === null) {
			continue
		}

		newFilters[key] = parser.parse(paramValue)
	}

	return newFilters
}

export function addFilterValue<C extends FiltersConfig, K extends keyof C>(
	prevFilters: FiltersFromConfig<C>,
	column: K,
	value: InferParser<C[K]> | null,
): FiltersFromConfig<C> {
	return {
		...prevFilters,
		[column]: value,
	}
}

export function removeFilterValue<C extends FiltersConfig, K extends keyof C>(
	prevFilters: FiltersFromConfig<C>,
	column: K,
): FiltersFromConfig<C> {
	const newFilters = { ...prevFilters }

	delete newFilters[column]

	return newFilters
}
