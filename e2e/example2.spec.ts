import {test as base, expect, BrowserContext, chromium} from "@playwright/test";
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
    await context.close();
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

test("add first tabset", async ({page, extensionId}) => {
  await page.goto(`chrome-extension://${extensionId}/www/index.html`);
  await page.waitForSelector('text=Actions')
  await page.locator('text=Actions').click()
  await page.waitForSelector('text=Add Tabset')
  await page.locator('text=Add Tabset').click()
  await page.waitForSelector('[data-testid=newTabsetName]')
  await page.locator('[data-testid=newTabsetName]').fill('first tabset')
  await page.locator('[data-testid=newTabsetNameSubmit]').click()
  await expect(page.locator('text=Add Tabset')).not.toBeVisible()
});


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
