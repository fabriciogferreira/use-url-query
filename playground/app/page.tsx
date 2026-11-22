import { Suspense } from 'react'
import { FilterPlayground } from './filter-playground'

export default function PlaygroundPage() {
	return (
		<Suspense fallback={<p>Loading…</p>}>
			<FilterPlayground />
		</Suspense>
	)
}
