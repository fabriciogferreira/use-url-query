type ConfigBase = {
	withEmpty?: boolean
	isOrderMatter?: boolean
}

type ConfigGrouped = ConfigBase & {
	group: true
}

type ConfigUngrouped = ConfigBase & {
	group?: false
}

export function combinations<F, S>(
	arry: [F[], S[]],
	config: ConfigGrouped
): (F | S)[][][]

export function combinations<F, S>(
	arry: [F[], S[]],
	config?: ConfigUngrouped
): (F | S)[][]

export function combinations<F, S>(arry: [F[], S[]], config?: ConfigGrouped | ConfigUngrouped) {
	const results: unknown[] = []

	const first = arry[0]
	const second = arry[1]

	first.forEach(fItem => {
		const groped: (F | S)[][] = []
		second.forEach(sItem => {
			if (config?.isOrderMatter) {
				groped.push([sItem, fItem])
			}
			groped.push([fItem, sItem])
		})

		if (config?.group) {
			results.push(groped)
		} else {
			results.push(...groped)
		}
	})

	if (config?.withEmpty) {
		results.push([])
	}

	return results
}

type configPowerSet = {
	removeEmpty?: boolean
	withSizes?: number |
		Array<number> |
		{ min: number, max: number} |
		{ min: number} |
		{ max: number} 
	isOrderMatter?: boolean
}
export function powerSet<T>(array: T[], config?: configPowerSet): T[][] {
	let results: T[][] = [[]]

	if (config?.isOrderMatter) {
		for (const item of array) {
			const snapshot = [...results]
	
			for (const subset of snapshot) {
				for (let i = 0; i <= subset.length; i++) {
					const copy = [...subset]
					copy.splice(i, 0, item)
					results.push(copy)
				}
			}
		}
	} else {
		array.forEach(item => {
			const length = results.length
			for (let i = 0; i < length; i++) {
				results.push([...results[i], item])
			}
		})
	}

	if (config?.removeEmpty) {
		results.shift()
	}

	if (config?.withSizes !== undefined) {
		const withSizes = config.withSizes

		if (typeof withSizes === 'number') {
			results = results.filter(item => item.length === withSizes)
		} else if (Array.isArray(withSizes)) {
			results = results.filter(item => withSizes.includes(item.length))
		} else if (typeof withSizes === 'object') {
			if ('min' in withSizes && 'max' in withSizes) {
				results = results.filter(item => item.length >= withSizes.min && item.length <= withSizes.max)
			} else if ('min' in withSizes) {
				results = results.filter(item => item.length >= withSizes.min)
			} else {
				results = results.filter(item => item.length <= withSizes.max)
			}
		}
	}

	return results
}
