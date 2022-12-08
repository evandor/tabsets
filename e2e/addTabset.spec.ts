import {test as base, expect, BrowserContext, chromium} from "@playwright/test";
import path from "path";
import {AboutPage} from "app/e2e/AboutPage";

export const test = base.extend<{
  context: BrowserContext;
  extensionId: string;
}>({
  context: async ({}, use) => {
    const pathToExtension = path.join(__dirname, "../dist/bex");

    const context = await chromium.launchPersistentContext("", {
      headless: false,
      args: [
        `--disable-extensions-except=${pathToExtension}`,
        `--load-extension=${pathToExtension}`,
      ],
    });
    // @ts-ignore
    await use(context);
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

const delay = (ms:number) => new Promise(resolve => setTimeout(resolve, ms))

test("add a new tab to a new tabset via addUrlDialog", async ({page, extensionId}) => {
  //test.use({ viewport: { width: 600, height: 900 } });
  const aboutPage = new AboutPage(page, extensionId);
  await aboutPage.goto()
  await aboutPage.submitNewTabsetDialog('another first tabset')
  await aboutPage.submitAddUrlDialog('https://www.skysail.io')

  await expect(page).toHaveURL(/.*\/tabsets\//);
  // const loc = page.locator('.text-subtitle2')
  await expect(page.locator('.text-subtitle2')).toHaveText('about:blank launch')
  await delay(1000)
  await aboutPage.screenshot(page, 'addTabset', 'finish2.png')

  await aboutPage.submitAddUrlDialog('https://www.heise.de')
  await expect(page.locator('.text-subtitle2')).toHaveText('about:blank launch')
  await aboutPage.screenshot(page, 'addTabset', 'finish3.png')
});

