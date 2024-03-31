import {Browser, BrowserContext, chromium, expect, test as base} from "@playwright/test";
import path from "path";
// @ts-ignore
import {SidePanelWelcomePageDefinition} from "app/e2e/PageDefs/SidePanelWelcomePageDefinition";
// @ts-ignore
import {SidePanelPageDefinition} from "app/e2e/PageDefs/SidePanelPageDefinition";

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

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

test("add the first tabset", async ({page, extensionId, context}) => {
  // test.use({ viewport: { width: 600, height: 900 } });
  const welcomePage = new SidePanelWelcomePageDefinition(page, extensionId);
  await welcomePage.goto()
  const sidePanelPage: SidePanelPageDefinition = await welcomePage.submitNewTabsetDialog('first tabset')
  const allPages = context.pages();
  //console.log("allPages", allPages)
  //allPages[allPages.length-1].close()
  //await sidePanelPage.clickStartDialog()
  // const tabsetsPage:TabsetTestPage = await aboutPage.submitAddUrlDialog('https://www.skysail.io')
  //
  // const skysailTabcardWidget = tabsetsPage.skysailTabcardWidget
  //await expect(sidePanelPage).toContainText("https://www.skysail.io")
  //await delay(10000)

  await sidePanelPage.screenshot(page, 'addFirstTabset', 'finish.png')

});

test("add tabset with tab", async ({page, extensionId, context}) => {
  // test.use({ viewport: { width: 600, height: 900 } });
  const welcomePage = new SidePanelWelcomePageDefinition(page, extensionId);
  await welcomePage.goto()
  const sidePanelPage: SidePanelPageDefinition = await welcomePage.submitNewTabsetDialog('first tabset')
  const allPages = context.pages();
  //console.log("allPages", allPages)
  //allPages[allPages.length-1].close()
  //await sidePanelPage.clickStartDialog()
  // const tabsetsPage:TabsetTestPage = await aboutPage.submitAddUrlDialog('https://www.skysail.io')
  //
  // const skysailTabcardWidget = tabsetsPage.skysailTabcardWidget
  //await expect(sidePanelPage).toContainText("https://www.skysail.io")
  //await delay(10000)
  await sidePanelPage.addToTabset()
  await sidePanelPage.screenshot(page, 'addFirstTabsetWithTab', 'finish.png')

});
