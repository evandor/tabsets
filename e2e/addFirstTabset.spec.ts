import { test, expect } from './fixtures';

function urlFor(extensionId: string, path: string) {
  return `chrome-extension://${extensionId}/www/index.html#${path}`
}

test('popup page', async ({ page, extensionId }) => {
  await page.goto(urlFor(extensionId, '/sidepanel/welcome'));
  //await page.goto("http://localhost:9000/#/sidepanel/welcome")

  const newTabsetName = page.locator('[data-testid=newTabsetName]')
  const addTabsetSubmitBtn = page.locator('[data-testid=addTabsetSubmitBtn]')

  await newTabsetName.fill("tabsetName")
  await addTabsetSubmitBtn.click()

  await page.goto(urlFor(extensionId, '/sidepanel'));
  await page.waitForURL('**\/sidepanel')

  const saveInTabsetBtn = page.locator('[data-testid=saveInTabsetBtn]')

  // await page.screenshot({ path: 'saveInTabsetBtn.png', fullPage: true });

  await saveInTabsetBtn.click()

  //await expect(page.locator('body')).toHaveText('my-extension popup');
});
