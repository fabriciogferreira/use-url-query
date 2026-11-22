import { useUrlQuery } from "../src/use-url-query";
import { expect, it, vi } from "vitest";
import { renderHook } from "@testing-library/react";
import z4 from "zod/v4";
import { parseAsInteger } from "nuqs";

const { mockedSearchParamsRef, pushSpy } = vi.hoisted(() => ({
	mockedSearchParamsRef: { current: new URLSearchParams("") as URLSearchParams },
	pushSpy: vi.fn(),
}));

vi.mock("next/navigation", () => ({
	useSearchParams: () => mockedSearchParamsRef.current,
	usePathname: () => "/",
	useRouter: () => ({
		push: pushSpy,
	}),
}));

it("check type expected", () => {
	mockedSearchParamsRef.current = new URLSearchParams("");

	const zUrlLooseNumber = z4.preprocess((value) => {
		if (value === "") return "";
		if (typeof value === "string") {
			const n = Number(value);
			return Number.isNaN(n) ? value : n;
		}
		return value;
	}, z4.union([z4.number(), z4.string()]));

	type T = z4.infer<typeof zUrlLooseNumber>;

	const { result } = renderHook(() =>
		useUrlQuery({
			normalizeFromUrl: true,
			filters: {
				number: parseAsInteger,
			},
		}),
	);

	// cases
	// não existe, então é undefined + T
	const _: undefined | T = result.current.filters.number;

	expect(true).toBe(true);
});

it("should be typescript error when filter non exist", () => {
	mockedSearchParamsRef.current = new URLSearchParams("");

	const { result } = renderHook(() =>
		useUrlQuery({
			normalizeFromUrl: true,
		}),
	);

	// @ts-expect-error
	result.current.filters.nonExist;

	expect(true).toBe(true);
});
