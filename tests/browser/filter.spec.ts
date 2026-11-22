import { expect, test } from '@playwright/test'

test.describe('filter (Next.js App Router)', () => {
	test('addFilter writes ?filter[key]=value to the URL', async ({ page }) => {
		await page.goto('/')

		await page.getByLabel('filter-key').fill('value')

		await expect(page).toHaveURL(/\?filter%5Bkey%5D=value|filter\[key\]=value/)
		await expect(page.getByTestId('query-string')).toHaveText(
			'?filter[key]=value',
		)
	})

	test('same key replaces instead of duplicating', async ({ page }) => {
		await page.goto('/')

		await page.getByLabel('filter-key').fill('value')
		await expect(page.getByTestId('query-string')).toHaveText(
			'?filter[key]=value',
		)

		await page.getByLabel('filter-key').fill('valuesubstituido')

		await expect(page.getByTestId('query-string')).toHaveText(
			'?filter[key]=valuesubstituido',
		)
		await expect(page).not.toHaveURL(/filter\[key\]=value&/)
		await expect(page.url()).not.toContain(
			'filter[key]=value&filter[key]=valuesubstituido',
		)
	})

	test('removeFilter clears the query string', async ({ page }) => {
		await page.goto('/')

		await page.getByLabel('filter-key').fill('value')
		await expect(page.getByTestId('query-string')).toHaveText(
			'?filter[key]=value',
		)

		await page.getByLabel('filter-key').fill('')

		await expect(page.getByTestId('query-string')).toHaveText('(empty)')
		await expect(page).toHaveURL(/\/$|\?$/)
	})
})
