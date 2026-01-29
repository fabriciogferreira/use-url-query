import { useUrlQuery } from "../src/use-url-query";
import { expect, it, mock } from "bun:test";
import { renderHook} from "@testing-library/react";
import z4 from "zod/v4";

let mockedSearchParams: URLSearchParams;

mock.module("next/navigation", () => ({
	useSearchParams: () => mockedSearchParams,
}));

it('check type expected', () => {
	mockedSearchParams = new URLSearchParams('');

	const zUrlLooseNumber = z4.preprocess(
		(value) => {
			if (value === '') return ''
			if (typeof value === 'string') {
				const n = Number(value)
				return Number.isNaN(n) ? value : n
			}
			return value
		},
		z4.union([z4.number(), z4.string()])
	)

	type T = z4.infer<typeof zUrlLooseNumber>;

	const { result } = renderHook(() =>
		useUrlQuery({
			normalizeFromUrl: true,
			filterSchema: z4.object({
				number: zUrlLooseNumber,
			})
		})
	);

	// cases
	// não existe, então é undefined + T
	const _: undefined | T = result.current.filters.number;

	expect(true).toBe(true);
})
