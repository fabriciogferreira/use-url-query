/** Spatie-style `fields[resource]=id,name` state. */
export type Fields = Record<string, string[]>

function normalizeFieldList(fields: string | string[]): string[] {
	const list = Array.isArray(fields) ? fields : [fields]
	return list.map((field) => field.trim()).filter(Boolean)
}

/** Build `fields[users]=id,name&fields[posts]=title` (joined with `&`). */
export function buildFieldsQueryString(
	fields: Fields,
	fieldParam: string,
): string {
	return Object.entries(fields)
		.filter(([, list]) => list.length > 0)
		.map(
			([resource, list]) =>
				`${fieldParam}[${resource}]=${list.join(',')}`,
		)
		.join('&')
}

/** Read `fields[resource]=…` entries from the current URL search params. */
export function parseFieldsFromSearchParams(
	searchParams:
		| { forEach(callback: (value: string, key: string) => void): void }
		| null
		| undefined,
	fieldParam: string,
): Fields {
	const fields: Fields = {}

	if (!searchParams) {
		return fields
	}

	const prefix = `${fieldParam}[`
	const suffix = ']'

	searchParams.forEach((value, key) => {
		if (!key.startsWith(prefix) || !key.endsWith(suffix)) {
			return
		}

		const resource = key.slice(prefix.length, -suffix.length)
		if (!resource) {
			return
		}

		const list = normalizeFieldList(value.split(','))
		if (list.length === 0) {
			return
		}

		fields[resource] = list
	})

	return fields
}

/** Merge field names into a resource (deduped, order preserved). */
export function addFieldValue(
	prevFields: Fields,
	resource: string,
	fields: string | string[],
): Fields {
	const toAdd = normalizeFieldList(fields)
	if (!resource || toAdd.length === 0) {
		return prevFields
	}

	const existing = prevFields[resource] ?? []
	const merged = [...existing]

	for (const field of toAdd) {
		if (!merged.includes(field)) {
			merged.push(field)
		}
	}

	return {
		...prevFields,
		[resource]: merged,
	}
}

/**
 * Remove field names from a resource.
 * Omit `fields` (or pass nothing to remove) to drop the whole resource entry.
 */
export function removeFieldValue(
	prevFields: Fields,
	resource: string,
	fields?: string | string[],
): Fields {
	if (!(resource in prevFields)) {
		return prevFields
	}

	if (fields === undefined) {
		const next = { ...prevFields }
		delete next[resource]
		return next
	}

	const toRemove = normalizeFieldList(fields)
	const remaining = (prevFields[resource] ?? []).filter(
		(field) => !toRemove.includes(field),
	)

	if (remaining.length === 0) {
		const next = { ...prevFields }
		delete next[resource]
		return next
	}

	return {
		...prevFields,
		[resource]: remaining,
	}
}
