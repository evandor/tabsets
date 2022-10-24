import {test as base, expect, BrowserContext, chromium} from "@playwright/test";
import path from "path";

let serviceWorker: Worker = null as unknown as Worker

export const test = base.extend<{
  context: BrowserContext;
  extensionId: string;
}>({
  context: async ({ }, use) => {
    const pathToExtension = path.join(__dirname, "../dist/bex");
    console.log("using path", pathToExtension)

    const userDataDir = '/tmp';
    // const browserContext = await chromium.launchPersistentContext(userDataDir,{
    //   headless: false,
    //   args: [
    //     `--disable-extensions-except=${pathToExtension}`,
    //     `--load-extension=${pathToExtension}`
    //   ]
    // });
    // await use(browserContext)
    // //console.log("browserContext", browserContext)
    //
    // let [serviceWorker] = browserContext.serviceWorkers()
    // //console.log("serviceWorker", serviceWorker)
    //
    // let [backgroundPage] = browserContext.backgroundPages();
    //
    // console.log("backgroundPage", backgroundPage)
    // if (!backgroundPage)
    //   backgroundPage = await browserContext.waitForEvent('backgroundpage');
    //
    // // Test the background page as you would any other page.
    // await browserContext.close();

    const context = await chromium.launchPersistentContext(userDataDir, {
      headless: false,
      args: [
        `--disable-extensions-except=${pathToExtension}`,
        `--load-extension=${pathToExtension}`,
      ],
    });
    // @ts-ignore
    serviceWorker = context.serviceWorkers()[0]
    //console.log("serviceWorker1", serviceWorker)
    await use(context);
    await context.close();
  },
  extensionId: async ({ context }, use) => {
    let [background] = context.serviceWorkers();
    if (!background)
      background = await context.waitForEvent("serviceworker");
    const extensionId = background.url().split("/")[2];
    console.log("hier!!!", extensionId)
    await use(extensionId);
  },
});

test("example test1", async ({ page }) => {
  await page.goto("chrome-extension://agphkldbejefifhmgpgmiphlnijklnol/www/index.html");
  await page.waitForSelector('text=Actions')
  // page.locator("html").innerHTML({timeout: 20000})
  //   .then((r) => console.log("r", r))
  await expect(page.locator("html")).toContainText("Tabsets");
});

// test("popup page", async ({ page, extensionId }) => {
//   await page.goto(`chrome-extension://${extensionId}/popup.html`);
//   await expect(page.locator("body")).toHaveText("my-extension popup");
// });

test("example test", async ({ page }) => {
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
