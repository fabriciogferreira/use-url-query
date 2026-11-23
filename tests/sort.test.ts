import { describe, expect, it } from "vitest"
import { cycleSortValue, normalizeSorts, type Sort } from "../src/sorts"

describe("normalizeSorts", () => {
	it("normalizes string columns to inactive asc sorts", () => {
		expect(normalizeSorts(["name", "email"])).toEqual([
			{ column: "name", label: "name", direction: "", include: false },
			{ column: "email", label: "email", direction: "", include: false },
		])
	})

	it("keeps explicit labels", () => {
		expect(normalizeSorts([{ column: "name", label: "Name" }])).toEqual([
			{ column: "name", label: "Name", direction: "", include: false },
		])
	})
})

describe("cycleSortValue", () => {
	const catalog: Sort[] = [
		{ column: "name", label: "name", direction: "", include: false },
		{ column: "email", label: "email", direction: "", include: false },
		{ column: "created_at", label: "created_at", direction: "", include: false },
	]

	it("returns the same array when the column is unknown", () => {
		expect(cycleSortValue(catalog, "missing")).toBe(catalog)
	})

	it("activates ascending and moves the sort to the last position", () => {
		expect(cycleSortValue(catalog, "name")).toEqual([
			{ column: "email", label: "email", direction: "", include: false },
			{
				column: "created_at",
				label: "created_at",
				direction: "",
				include: false,
			},
			{ column: "name", label: "name", direction: "", include: true },
		])
	})

	it("cycles ascending to descending without changing position", () => {
		const active = cycleSortValue(catalog, "name")

		expect(cycleSortValue(active, "name")).toEqual([
			{ column: "email", label: "email", direction: "", include: false },
			{
				column: "created_at",
				label: "created_at",
				direction: "",
				include: false,
			},
			{ column: "name", label: "name", direction: "-", include: true },
		])
	})

	it("cycles descending back to inactive", () => {
		const active = cycleSortValue(catalog, "name")
		const descending = cycleSortValue(active, "name")

		expect(cycleSortValue(descending, "name")).toEqual([
			{ column: "email", label: "email", direction: "", include: false },
			{
				column: "created_at",
				label: "created_at",
				direction: "",
				include: false,
			},
			{ column: "name", label: "name", direction: "", include: false },
		])
	})

	it("appends newly activated sorts after already active ones", () => {
		const withName = cycleSortValue(catalog, "name")
		const withEmail = cycleSortValue(withName, "email")

		expect(withEmail.filter((sort) => sort.include).map((sort) => sort.column)).toEqual([
			"name",
			"email",
		])
		expect(
			withEmail
				.filter((sort) => sort.include)
				.map((sort) => sort.direction + sort.column)
				.join(","),
		).toBe("name,email")
	})
})
