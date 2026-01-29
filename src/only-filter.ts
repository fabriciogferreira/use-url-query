import { useMemo, useState, useEffect } from "react"
import { useSearchParams } from "next/navigation";
import { schemaToQueryString as fnSchemaToQueryString } from "@fabriciogferreira/schema-to-query-string";
import z4, { ZodObject, ZodType } from "zod/v4";

type Direction = '-' | ''

export type Sort = {
	column: string;
	label: string;
	direction: Direction;
	include: boolean;
}

type SortParam = Pick<Sort, 'column' | 'label'>[] | Sort['column'][]

type Params = {
	sorts?: SortParam;
	normalizeFromUrl?: boolean;
	schemaToQueryString?: {
		schema: ZodObject
		rootResource: string
		includeKey: string | undefined
		fieldsKey: string | undefined
	}
	filterSchema?: Record<string, ZodType>
}

//FILTER
type Filters = Record<PropertyKey, unknown>;
type FiltersQueryString = string;
type AddFilter = (column: string, value: unknown) => void;
type RemoveFilter = (column: string, value: unknown) => void;


export type UseUrlQuery = (params?: Params) => {
	//FILTER
	filters: Filters;
	filtersQueryString: FiltersQueryString;
	addFilter: AddFilter;
	removeFilter: RemoveFilter;
}

export type UseUrlQueryContext = ReturnType<UseUrlQuery>;

export const useUrlQuery: UseUrlQuery = ({
	normalizeFromUrl = true,
	schemaToQueryString,
	filterSchema
} = {}) => {
	//LIFECYCLE INIT
	let schemaConverted = '';
	if (schemaToQueryString) {
		schemaConverted = fnSchemaToQueryString(
			schemaToQueryString.schema,
			schemaToQueryString.rootResource,
			schemaToQueryString.includeKey,
			schemaToQueryString.fieldsKey,
		)
	}

	//FILTER
	type FilterSchema = z4.infer<typeof filterSchema>
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

		const newFilters = {};

		searchParams.forEach((value, key) => {
			const filterMatch = key.match(/^filter\[(.+)\]$/);

			if (filterMatch) {
				const column = filterMatch[1];

				if (filterSchema) {
					const schemaField = filterSchema[column]

					if (schemaField) {
						const result = schemaField.safeParse(value)

						if (result.success) {
							newFilters[column] = result.data
							return
						}
					}
				}

				newFilters[column] = value;

				return
			}
		});

		setFilters(newFilters)
	}, [normalizeFromUrl])

	return {
		filters,
		filtersQueryString,
		addFilter,
		removeFilter,
	}
}