import {test as base, expect, BrowserContext, chromium, Page} from "@playwright/test";
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

test("add a new tab to a new tabset via addUrlDialog", async ({page, extensionId}) => {
  const aboutPage = new AboutPage(page, extensionId);
  await aboutPage.goto()
  await aboutPage.submitNewTabsetDialog('another first tabset')
  await aboutPage.submitAddUrlDialog('https://www.skysail.io')

  await expect(page).toHaveURL(/.*\/tabsets\//);
  // const loc = page.locator('.text-subtitle2')
  await expect(page.locator('.text-subtitle2')).toHaveText('about:blank launch')
  await aboutPage.screenshot(page, 'addTabset', 'finish.png')
});

