import {Browser, BrowserContext, chromium, expect, test as base} from "@playwright/test";
import path from "path";
import {AboutPage} from "app/e2e/AboutPage";
import {TabsetTestPage} from "app/e2e/TabsetTestPage";

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
  }

});

const delay = (ms:number) => new Promise(resolve => setTimeout(resolve, ms))


test("add a new tab to a new tabset via new browser tab", async ({page, extensionId, context}) => {
  const aboutPage = new AboutPage(page, extensionId);
  await aboutPage.goto()
  const tabsetPage:TabsetTestPage = await aboutPage.submitNewTabsetDialog('another first tabset')

  await delay(1000)
 // const pageOne = await context.newPage();
  const pageTwo = await context.newPage();
  await pageTwo.goto("https://www.test.de")

  const pendingTab = await tabsetPage.waitForAndGetPendingTab('wwwtestde')
  await expect(pendingTab).toContainText("Warentest")

  // browser.newPage()
  // window.open('https://www.facebook.com/')
  //await page.goto('https://www.facebook.com/');
})



