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

test("add a new tab to a new tabset via addUrlDialog", async ({page, extensionId}) => {
  //test.use({ viewport: { width: 600, height: 900 } });
  const aboutPage = new AboutPage(page, extensionId);
  await aboutPage.goto()
  await aboutPage.submitNewTabsetDialog('another first tabset')

  const tabsetsPage:TabsetTestPage = await aboutPage.submitAddUrlDialog('https://www.skysail.io')

  const skysailTabcardWidget = tabsetsPage.skysailTabcardWidget
  await expect(skysailTabcardWidget).toContainText("https://www.skysail.io")
  await delay(1000)
  await aboutPage.screenshot(page, 'addTabset', 'finish2.png')

});

// will not work right now as pending tabs is disabled
// test("add a new tab to a new tabset via addUrlDialog2", async ({page, extensionId, context}) => {
//   const aboutPage = new AboutPage(page, extensionId);
//   await aboutPage.goto()
//   const tabsetPage:TabsetTestPage = await aboutPage.submitNewTabsetDialog('another first tabset')
//
//   await delay(1000)
//  // const pageOne = await context.newPage();
//   const pageTwo = await context.newPage();
//   await pageTwo.goto("https://www.test.de")
//
//   const pendingTab = await tabsetPage.waitForAndGetPendingTab('wwwtestde')
//   await expect(pendingTab).toContainText("test.de")
//
//   // browser.newPage()
//   // window.open('https://www.facebook.com/')
//   //await page.goto('https://www.facebook.com/');
// })

// test("add a new tab to a tabset via addUrlDialog and clicking on undo", async ({page, extensionId}) => {
//   const aboutPage = new AboutPage(page, extensionId);
//   await aboutPage.goto()
//   await aboutPage.submitNewTabsetDialog('a tabset')
//
//   const tabsetsPage:TabsetTestPage = await aboutPage.submitAddUrlDialog('https://www.heise.de')
//
//   const tabcardWidget = tabsetsPage.heiseTabcardWidget
//   await expect(tabcardWidget).toContainText("https://www.heise.de")
//   await delay(1000)
//   await aboutPage.screenshot(page, 'addTabset', 'finish3.png')
// });

