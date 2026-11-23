'use client'

import { parseAsString } from 'nuqs'
import { useUrlQuery } from '../../src/use-url-query'


/** Minimal Next client surface to exercise `addFilter` / `removeFilter` in App Router. */
export function FilterPlayground() {
	const { filters, addFilter, removeFilter, queryString } = useUrlQuery({
		filters: {
			key: parseAsString,
		},
	})

	return (
		<main>
			<h1>Filter playground</h1>
			<label>
				key
				<input
					aria-label="filter-key"
					value={filters.key ?? ''}
					onChange={(event) => {
						const value = event.target.value
						if (value === '') {
							removeFilter('key')
							return
						}
						addFilter('key', value)
					}}
				/>
			</label>
			<p data-testid="query-string">{queryString || '(empty)'}</p>
		</main>
	)
}
