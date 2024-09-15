import {test} from './fixtures';

function urlFor(extensionId: string, path: string) {
  return `chrome-extension://${extensionId}/www/index.html#${path}`
}

test('first tabset', async ({page, extensionId, context}) => {
  await page.goto(urlFor(extensionId, '/sidepanel?first=true'));
  //await page.goto("http://localhost:9000/#/sidepanel/welcome")

  const newTabsetName = page.locator('[data-testid=newTabsetName]')
  const addTabsetSubmitBtn = page.locator('[data-testid=addTabsetSubmitBtn]')

  await newTabsetName.fill("tabsetName")
  await addTabsetSubmitBtn.click()

  await page.goto(urlFor(extensionId, '/sidepanel'));
  await page.waitForURL('**\/sidepanel')

  const newTab = await context.newPage();
  await newTab.goto("https://www.skysail.io");

  const saveInTabsetBtn = page.locator('[data-testid=saveInTabsetBtn]')

  // await page.screenshot({ path: 'saveInTabsetBtn.png', fullPage: true });

  await saveInTabsetBtn.click()
  await page.waitForURL('**\/sidepanel')

  const addTabsetBtn = page.locator('[data-testid=addTabsetBtn]')
  await addTabsetBtn.click()
  await newTabsetName.fill("tabsetName2")

  const newTabsetAutoAdd = page.locator('[data-testid=newTabsetAutoAdd]')
  await newTabsetAutoAdd.check()

  const newTabsetNameSubmit = page.locator('[data-testid=newTabsetNameSubmit]')
  await newTabsetNameSubmit.click()

  //await page.waitForURL('**\/sidepanel')

  const expansionItem = page.locator('[data-testid=expansion_tabsetName]')
  await expansionItem.hover()
  await expansionItem.click()

  // await expansionItem.hover()
  // await expansionItem.click()
  //
  // const skysailMenu = page.locator('[data-testid=menu_23]')
  // await skysailMenu.click()
  //
  // await expansionItem.hover()
  // await expansionItem.click()

  //await expect(page.locator('body')).toHaveText('my-extension popup');
});
