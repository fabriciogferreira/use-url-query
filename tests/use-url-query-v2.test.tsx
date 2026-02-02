import { useQueryState } from "nuqs";
const [name, setName] = useQueryState('name')
import { useUrlQuery } from "../src/only-filter";
import { expect, it, mock } from "bun:test";
import { renderHook } from "@testing-library/react";


let mockedSearchParams: URLSearchParams;

mock.module("next/navigation", () => ({
	useSearchParams: () => mockedSearchParams,
}));

it('should return undefined when field is missing', () => {
	mockedSearchParams = new URLSearchParams('');

	const { result } = renderHook(() =>
		useUrlQuery({
			normalizeFromUrl: true,

		})
	);

	result.current.addFilter('adsasd', 111) /// não aparece

	expect(result.current.filters.number).toEqual(undefined);
})
