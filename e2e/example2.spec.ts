import {test as base, expect, BrowserContext, chromium, Page} from "@playwright/test";
import path from "path";

export const test = base.extend<{
  context: BrowserContext;
  extensionId: string;
}>({
  context: async ({}, use) => {
    const pathToExtension = path.join(__dirname, "../dist/bex");
    console.log("using path", pathToExtension)
    const userDataDir = '/tmp';

    const context = await chromium.launchPersistentContext("", {
      headless: false,
      args: [
        `--disable-extensions-except=${pathToExtension}`,
        `--load-extension=${pathToExtension}`,
      ],
    });
    // @ts-ignore
    await use(context);
    //await context.close();
    setTimeout(() => { context.close(); }, 3000);

  },
  extensionId: async ({context}, use) => {
    let [background] = context.serviceWorkers();
    if (!background)
      background = await context.waitForEvent("serviceworker");
    const extensionId = background.url().split("/")[2];
    await use(extensionId);
  },
});

test("actions button has 'add tabset' entry", async ({page, extensionId}) => {
  await page.goto(`chrome-extension://${extensionId}/www/index.html`);
  await page.waitForSelector('text=Actions')
  await expect(page.locator('text=Add Tabset')).not.toBeVisible()
  await page.locator('text=Actions').click()
  await expect(page.locator('text=Add Tabset')).toBeVisible()
});

function clickByText(page: Page, strings: string[]) {
  strings.forEach(s => {
    const selector = 'text='+s
    console.log("selector set to ", selector)
    page.locator(selector).click()
  })
}

function clickByTestId(page: Page, strings: string[]) {
  strings.forEach(s => {
    const selector = '[data-testid='+s+']'
    console.log("selector set to ", selector)
    page.locator(selector).click()
  })
}

test("add first tabset", async ({page, extensionId}) => {
  await page.goto(`chrome-extension://${extensionId}/www/index.html`);
  await page.waitForSelector('text=Actions')

  clickByText(page, ['Actions', 'Add Tabset'])
  //await page.waitForSelector('[data-testid=newTabsetName]')
  await page.locator('[data-testid=newTabsetName]').fill('first tabset')
  await page.locator('[data-testid=newTabsetNameSubmit]').click()
  await expect(page.locator('text=Add Tabset')).not.toBeVisible()
});

// test("add first tabset", async ({page, extensionId}) => {
//   await page.goto(`chrome-extension://${extensionId}/www/index.html`);
//   await page.waitForSelector('text=Actions')
//
//   clickByText(page, ['Actions', 'Add Tabset'])
//   await page.waitForSelector('[data-testid=newTabsetName]')
//   clickByTestId(page, ['newTabsetName', 'newTabsetNameSubmit'])
//
//   await page.waitForSelector('text=first tabset (0 tab)')
//   await expect(page.locator('text=Add Tabset')).not.toBeVisible()
// });

test("example test", async ({page}) => {
  await page.goto("https://tabsets-spa.web.app/#");
  //console.log("serviceWorker2", serviceWorker)
  //serviceWorker.
  await page.waitForSelector('text=Sign in with email')
  //await page.waitForLoadState('domcontentloaded')
  // page.locator("#q-app").innerHTML()
  //   .then((r) => console.log("r", r))
  await page.locator('text=Sign in with email').click()
  await expect(page.locator("body")).toContainText("Tabsets");
});
