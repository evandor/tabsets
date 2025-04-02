import { expect, test } from '@playwright/test'

test.describe('block one', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('https://playwright.dev/')
  })

  test('main navigation', async ({ page }) => {
    await expect(page).toHaveURL('https://playwright.dev/')
  })
})

test.describe('block two', () => {
  test.beforeEach(async ({ page }) => {
    console.log('A')
    await page.goto('https://skysail.io/')
  })

  test('check title', async ({ page }) => {
    console.log('A1')
    await expect(page).toHaveTitle('Skysail Consulting')
  })

  test('main navigation', async ({ page }) => {
    console.log('A2')
    await page.waitForTimeout(3000)
    await expect(page.locator('body')).toContainText('professional')
  })
})

test.describe('block three', () => {
  ;[
    { name: 'Alice', expected: 'Hello, Alice!' },
    { name: 'Bob', expected: 'Hello, Bob!' },
    { name: 'Charlie', expected: 'Hello, Charlie!' },
  ].forEach(({ name, expected }) => {
    test(`testing with ${name}`, async ({ page }) => {
      await page.goto(`https://example.com/greet?name=${name}`)
      await expect(page.getByRole('heading')).toHaveText(expected)
    })
  })
})
