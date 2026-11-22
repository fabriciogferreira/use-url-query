import { defineConfig, devices } from '@playwright/test'

const port = Number(process.env.PLAYGROUND_PORT ?? 3017)
const baseURL = `http://127.0.0.1:${port}`

// Browser tests live in this package so the hook’s Next.js behavior is gated
// here — not only in demo-web.
export default defineConfig({
	testDir: './tests/browser',
	fullyParallel: true,
	forbidOnly: !!process.env.CI,
	retries: process.env.CI ? 2 : 0,
	workers: process.env.CI ? 1 : undefined,
	reporter: 'list',
	use: {
		baseURL,
		trace: 'on-first-retry',
	},
	projects: [
		{
			name: 'chromium',
			use: { ...devices['Desktop Chrome'] },
		},
	],
	webServer: {
		command: `bunx next dev playground --port ${port} --hostname 127.0.0.1`,
		url: baseURL,
		reuseExistingServer: !process.env.CI,
		timeout: 120_000,
	},
})
