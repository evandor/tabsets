import {test, expect} from './fixtures';
import {Page} from "@playwright/test";

function urlFor(extensionId: string, path: string) {
  return `chrome-extension://${extensionId}/www/index.html#${path}`
}

test('first tabset', async ({page, extensionId, context}) => {

  // await page.keyboard.type('Command+b');

  //await page.goto(urlFor(extensionId, '/sidepanel?first=true'));
  await page.goto(urlFor(extensionId, '/mainpanel/settings'));

  await page.locator('[id=closeRightDrawerIcon]').click()
  const openSidePanelSpan = page.locator('[id=openSidePanelSpan]')
  await openSidePanelSpan.click()
  //await page.goto("http://localhost:9000/#/sidepanel/welcome")


  await page.waitForTimeout(3000);

  page.context().pages().forEach((p: Page) => {
    console.log("p", p.url())
  })

  const sidePanelPage: Page = page.context().pages().find((value) => {
    // console.log("checking", value.url(), value.url().match(extensionId), value.url().match("www/sidepanel.html"))
    return value && value.url() && value.url().match(extensionId) && value.url().match("sidepanel/welcome")
  }) as Page
  console.log("found sidePanelPage", sidePanelPage.url())

  // const html = await sidePanelPage.content()
  // console.log("html", html)

  const newTabsetName = sidePanelPage.locator('[data-testid=newTabsetName]')
  await newTabsetName.fill("tabsetName")

  // await sidePanelPage.getByText("ADD TABSET").click()

  const addTabsetSubmitBtn = sidePanelPage.locator('[data-testid=addTabsetSubmitBtn]')
  await addTabsetSubmitBtn.click()

  const tabsetId = await page.evaluate(() => localStorage.getItem('test.tabsetId'))
  console.log("tabsetId", tabsetId)

  // await page.goto(urlFor(extensionId, '/sidepanel'));
  // await page.waitForURL('**\/sidepanel')
  //
  const newTab = await context.newPage();
  await newTab.goto("https://www.skysail.io");

  const saveInTabsetBtn = sidePanelPage.locator('[data-testid=saveInTabsetBtn]')
  // // await page.screenshot({ path: 'saveInTabsetBtn.png', fullPage: true });
  await saveInTabsetBtn.click()
  const tabId = await page.evaluate(() => localStorage.getItem('test.tabId'))
  console.log("tabId", tabId)

  const skysailTabDetails = await context.newPage();
  await skysailTabDetails.goto(urlFor(extensionId, `/mainpanel/tab/${tabId}`));

  await skysailTabDetails.locator('#contentTab').click()
  // await skysailTabDetails.locator('#debugTab').click()

  expect(skysailTabDetails.locator('[data-testid=content]')).toContainText('this website uses cookies ensure best experience')


  // await skysailTabDetails.locator('#debugTabA').click()

  // await page.waitForURL('**\/sidepanel')
  //
  // const addTabsetBtn = page.locator('[data-testid=addTabsetBtn]')
  // await addTabsetBtn.click()
  // await newTabsetName.fill("tabsetName2")
  //
  // const newTabsetAutoAdd = page.locator('[data-testid=newTabsetAutoAdd]')
  // await newTabsetAutoAdd.check()
  //
  // const newTabsetNameSubmit = page.locator('[data-testid=newTabsetNameSubmit]')
  // await newTabsetNameSubmit.click()

  //await page.waitForURL('**\/sidepanel')


  //await expect(page.locator('body')).toHaveText('my-extension popup');
});
