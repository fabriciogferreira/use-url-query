import { defineConfig } from 'vitest/config'

// Vitest (not bun:test): happy-dom for renderHook; setup cleans Testing Library.
// Inline schema-to-query-string so Vite resolves its extensionless ESM relative imports.
export default defineConfig({
	test: {
		environment: 'happy-dom',
		setupFiles: ['./testing-library.ts'],
		include: ['tests/**/*.{test,spec}.{ts,tsx}'],
		exclude: ['tests/browser/**', 'node_modules/**', 'playground/**'],
		server: {
			deps: {
				inline: ['@fabriciogferreira/schema-to-query-string'],
			},
		},
		coverage: {
			provider: 'v8',
			reporter: ['text', 'html', 'clover'],
			include: ['src/**/*.ts'],
			exclude: ['src/index.ts', '**/*.d.ts'],
		},
	},
})
