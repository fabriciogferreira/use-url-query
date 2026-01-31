import { expect, it } from "bun:test";
import { combinations, powerSet } from "../src/combine";

it('expect combinations of two arrays', () => {
	const expected = [
		['a', 1],
		['a', 2],
		['b', 1],
		['b', 2],
	]
	const result = combinations([['a', 'b'], [1, 2]])

	expect(result).toEqual(expected)
})

it('expect combinations of two arrays with empty', () => {
	const expected = [
		['a', 1],
		['a', 2],
		['b', 1],
		['b', 2],
		[]
	]
	const result = combinations([['a', 'b'], [1, 2]], { withEmpty: true })

	expect(result).toEqual(expected)
})

it('expect combinations of two arrays where order matters', () => {
	const expected = [
		[1, 'a'],
		['a', 1],
		[2, 'a'],
		['a', 2],
		[1, 'b'],
		['b', 1],
		[2, 'b'],
		['b', 2],
	]
	const result = combinations([['a', 'b'], [1, 2]], { isOrderMatter: true })

	expect(result).toEqual(expected)
})

it('expect grouped combinations of two arrays', () => {
	const expected = [
		[
			['a', 1],
			['a', 2],
		],
		[
			['b', 1],
			['b', 2],
		],
	]
	const result = combinations([['a', 'b'], [1, 2]], { group: true })

	expect(result).toEqual(expected)
})

const sorts: string[][] = combinations([['', '-'], ['a', 'b', 'c']])
const groupedSorts: string[][][] = combinations([['', '-'], ['a', 'b', 'c']], { group: true })

it('expect power set of an array', () => {
	const expected = [
		[],
		['a'],
		['b'],
		['a', 'b'],
	];

	const result = powerSet(['a', 'b'])

	expect(result).toEqual(expected)
})

it('expect power set of an array with remove void', () => {
	const expected = [
		['a'],
		['b'],
		['a', 'b'],
	];

	const result = powerSet(['a', 'b'], { removeEmpty: true })

	expect(result).toEqual(expected)
})

it('expect power set of an array with sizes', () => {
	const expected = [
		['a', 'b'],
	];

	const result = powerSet(['a', 'b'], { withSizes: 2 })

	expect(result).toEqual(expected)
})

it('expect power set of an array with sizes', () => {
	const expected = [
		[],
		['a', 'b'],
	];

	const result = powerSet(['a', 'b'], { withSizes: [0, 2] })

	expect(result).toEqual(expected)
})

it('expect power set of an array with min sizes', () => {
	const expected = [
		['a'],
		['b'],
		['a', 'b'],
	];

	const result = powerSet(['a', 'b'], { withSizes: { min: 1 } })

	expect(result).toEqual(expected)
})

it('expect power set of an array with max sizes', () => {
	const expected = [
		[],
		['a'],
		['b'],
	];

	const result = powerSet(['a', 'b'], { withSizes: { max: 1 } })

	expect(result).toEqual(expected)
})

it('expect power set of an array with min and max sizes', () => {
	const expected = [
		['a'],
		['b'],
		['a', 'b'],
	];
	
	const result = powerSet(['a', 'b'], { withSizes: { min: 1, max: 2 } })

	expect(result).toEqual(expected)
})

it('expect power set of an array where order matters', () => {
	const expected = [
		[],
		['a'],
		['b'],
		['b', 'a'],
		['a', 'b'],
	];

	const result = powerSet(['a', 'b'], { isOrderMatter: true })

	expect(result).toEqual(expected)
})