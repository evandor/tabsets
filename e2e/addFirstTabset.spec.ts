import { Page } from '@playwright/test'
import { expect, test } from './fixtures'

function urlFor(extensionId: string, path: string) {
  return `chrome-extension://${extensionId}/www/index.html#${path}`
}

test('first tabset', async ({ page, extensionId, context }) => {
  // === click in settings page to activate sidepanel ===
  const settingsUrl = urlFor(extensionId, '/mainpanel/settings')
  console.log('settingsUrl', settingsUrl)
  await page.goto(settingsUrl)

  await page.locator('[id=closeRightDrawerIcon]').click()
  const openSidePanelSpan = page.locator('[id=openSidePanelSpan]')
  await openSidePanelSpan.click()

  await page.waitForTimeout(2000)

  const sidePanelPage: Page = page
    .context()
    .pages()
    .find((value) => {
      return value && value.url() && value.url().match(extensionId) && value.url().match('sidepanel/welcome')
    }) as Page
  console.log('found sidePanelPage', sidePanelPage.url())

  // === create first tabset ===
  const newTabsetName = sidePanelPage.locator('[data-testid=newTabsetName]')
  await newTabsetName.fill('tabsetName')
  await sidePanelPage.locator('[data-testid=addTabsetSubmitBtn]').click()
  const tabsetId = await page.evaluate(() => localStorage.getItem('test.tabsetId'))
  console.log('tabsetId', tabsetId)

  // === open new tab and goto skysail.io ===
  const newTab = await context.newPage()
  await newTab.goto('https://www.skysail.io')

  // === save skysail as tab in current tabset ===
  const saveInTabsetBtn = sidePanelPage.locator('[data-testid=saveInTabsetBtn]')
  await saveInTabsetBtn.click()
  const tabId = await page.evaluate(() => localStorage.getItem('test.tabId'))
  console.log('tabId', tabId)

  // === validate new tab in tab details page ===
  const skysailTabDetails = await context.newPage()
  await skysailTabDetails.goto(urlFor(extensionId, `/mainpanel/tab/${tabId}`))
  await skysailTabDetails.locator('#contentTab').click()
  // await skysailTabDetails.locator('#debugTab').click()
  expect(skysailTabDetails.locator('[data-testid=content-content]')).toContainText(
    'this website uses cookies ensure best experience',
  )
  expect(skysailTabDetails.locator('[data-testid=content-meta]')).toContainText('noindex, nofollow')
  expect(skysailTabDetails.locator('[data-testid=content-title]')).toContainText('Skysail Consulting')

  // await skysailTabDetails.locator('#debugTabA').click()
})
