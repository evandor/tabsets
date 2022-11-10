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
    setTimeout(() => {
      context.close();
    }, 3000);

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
    const selector = 'text=' + s
    console.log("selector set to ", selector)
    page.locator(selector).click()
  })
}

function clickByTestId(page: Page, strings: string[]) {
  strings.forEach(s => {
    const selector = '[data-testid=' + s + ']'
    console.log("selector set to ", selector)
    page.locator(selector).click()
  })
}

async function fillByTestId(page: Page, ident: string, text: string) {
  const selector = '[data-testid=' + ident + ']'
  console.log("selector set to ", selector)
  await page.locator(selector).fill(text)
}

test("delete tabset", async ({page, extensionId}) => {
  await page.goto(`chrome-extension://${extensionId}/www/index.html`);
  await page.waitForSelector('text=Actions')

  clickByText(page, ['Actions', 'Add Tabset'])
  await fillByTestId(page, 'newTabsetName', 'second_tabset')
  clickByTestId(page, ['newTabsetNameSubmit'])
  clickByTestId(page, ['fab_widget', 'fab_add_url'])
  await fillByTestId(page, 'fab_add_url_input', 'https://www.test.de')
  clickByTestId(page, ['fab_add_url_submit'])

  await page.locator('[data-testid=navigation_tabset_0]').hover()
    .then(() => page.locator('[data-testid=navigation_tabset_delete_0]').hover())
    .then(() => clickByTestId(page, ['navigation_tabset_delete_0']))

  // clickByTestId(page, ['navigation_tabset_0'])
  // await page.waitForSelector('[data-testid=navigation_tabset_delete_0]')

  //
  //await expect(page.locator('[data-testid=expansion_item_unpinnedNoGroup2]')).toContainText("test.de");
});
