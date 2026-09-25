import { test, expect } from '@playwright/test'

test.describe('E2E Smoke Test', () => {
  test('application loads and responds at /', async ({ page }) => {
    await page.goto('/')
    await expect(page).toHaveTitle(/Vite|CDSS-CR|SAMED/i)
  })
})
