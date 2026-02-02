import { useMemo, useState, useEffect } from "react"
import { useSearchParams } from "next/navigation";
import z4, { ZodObject, ZodType } from "zod/v4";

type Params<S extends z4.ZodRawShape> = {
	normalizeFromUrl?: boolean
	filters?: z4.ZodObject<S>
}

//FILTER
type AddFilter = (column: string, value: unknown) => void;
type RemoveFilter = (column: string, value: unknown) => void;

type FiltersFromSchema<S extends z4.ZodRawShape> = {
	[K in keyof S]?: z4.infer<S[K]>
} & Record<string, unknown>

export function useUrlQuery<S extends z4.ZodRawShape = {}>({
	normalizeFromUrl = true,
	filters
}: Params<S> = {}) {
	//FILTER
	type Filters = FiltersFromSchema<S>

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

				return `filter[${key}]=${valueParsed}`
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

	//LIFECYCLE
	useEffect(() => {
		if (!normalizeFromUrl) return;

		const searchParams = useSearchParams();

		if (searchParams == undefined) return

		const newFilters: Record<string, unknown> = {};

		searchParams.forEach((value, key) => {
			const filterMatch = key.match(/^filter\[(.+)\]$/);

			if (!filterMatch) return

			if (filterMatch) {
				const column = filterMatch[1];

				if (filters?.shape[column]) {
					const parsed = filters.shape[column]

					if (parsed instanceof z4.ZodType) {
						const result = parsed.safeParse(value)

						if (result.success) {
							newFilters[column] = result.data
							return
						}
					}
				}

				newFilters[column] = value;
			}
		});

		setFilters(newFilters as Filters)
	}, [normalizeFromUrl])

	return {
		filters,
		filtersQueryString,
		addFilter,
		removeFilter,
	}
}