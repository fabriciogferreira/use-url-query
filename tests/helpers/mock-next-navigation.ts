import { vi } from 'vitest'

// Shared Next.js navigation doubles for hook tests (Vitest hoists vi.mock).
// Do not export hoisted bindings — Vitest forbids that; expose helpers instead.
const { mockedSearchParamsRef, pushSpy } = vi.hoisted(() => ({
	mockedSearchParamsRef: {
		current: new URLSearchParams('') as URLSearchParams,
	},
	pushSpy: vi.fn(),
}))

vi.mock('next/navigation', () => ({
	useSearchParams: () => mockedSearchParamsRef.current,
	usePathname: () => '/',
	useRouter: () => ({
		push: pushSpy,
	}),
}))

export function resetNextNavigationMock(
	search = new URLSearchParams(''),
): void {
	mockedSearchParamsRef.current = search
	pushSpy.mockClear()
}

export function getPushSpy() {
	return pushSpy
}
