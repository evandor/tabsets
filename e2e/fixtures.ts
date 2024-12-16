import { type BrowserContext, chromium, test as base } from '@playwright/test'
import path from 'path'
import { fileURLToPath } from 'url';

process.env.PW_CHROMIUM_ATTACH_TO_OTHER = '1'

export const test = base.extend<{
  context: BrowserContext;
  extensionId: string;
}>({
  context: async ({}, use) => {
console.log("hier", use)
    const __filename = fileURLToPath(import.meta.url); // get the resolved path to the file
    const __dirname = path.dirname(__filename); // get the name of the directory

    const pathToExtension = path.join(__dirname, '../dist/bex-chrome--dev')
    console.log('pathToExtension', pathToExtension)
    const context = await chromium.launchPersistentContext('', {
      headless: false,
      args: [
        `--disable-extensions-except=${pathToExtension}`,
        `--load-extension=${pathToExtension}`,
        '--start-maximized'
      ]
    })
    await use(context)
    await context.close()
  },
  extensionId: async ({ context }, use) => {
    // console.log("context", context)
    // console.log("use", use)
    /*
    // for manifest v2:
    let [background] = context.backgroundPages()
    if (!background)
      background = await context.waitForEvent('backgroundpage')
    */

    // for manifest v3:
    let [background] = context.serviceWorkers()
    if (!background)
      background = await context.waitForEvent('serviceworker')

    const extensionId = background.url().split('/')[2]
    await use(extensionId!)
  }
})
export const expect = test.expect
