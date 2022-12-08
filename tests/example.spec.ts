const {test: base, chromium, webkit, expect} = require('@playwright/test')
const path = require('path')

const extensionPath = path.join(__dirname, '../build') // make sure this is correct

const test = base.extend({
// @ts-ignore
  context: async ({browserName}, use: any) => {
    const browserTypes = {chromium, webkit}
    const launchOptions = {
      devtools: true,
      headless: true,
      args: [
        `--disable-extensions-except=${extensionPath}`
      ],
      viewport: {
        width: 1920,
        height: 1080
      }
    }
    // @ts-ignore
    const context = await browserTypes[browserName as keyof object].launchPersistentContext(
      '',
      launchOptions
    )
    await use(context)
    await context.close()
  }
})

test.describe('Popup', () => {
  // @ts-ignore
  test('our extension loads', async ({page}) => {
    await page.goto(
      'chrome-extension://<extension-id>/popup.html'
    )
    await page.waitForTimeout(30000) // this is here so that it won't automatically close the browser window
  })
})

// test('homepage has Playwright in title and get started link linking to the intro page', async ({page}) => {
//   await page.goto('https://playwright.dev/');
//
//   // Expect a title "to contain" a substring.
//   await expect(page).toHaveTitle(/Playwright/);
//
//   // create a locator
//   const getStarted = page.getByText('Get Started');
//
//   // Expect an attribute "to be strictly equal" to the value.
//   await expect(getStarted).toHaveAttribute('href', '/docs/intro');
//
//   // Click the get started link.
//   await getStarted.click();
//
//   // Expects the URL to contain intro.
//   await expect(page).toHaveURL(/.*intro/);
// });
