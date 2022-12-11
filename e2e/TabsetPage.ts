import {Page} from "@playwright/test";

export class TabsetPage {

  async fillByTestId(page: Page, ident: string, text: string) {
    const selector = '[data-testid=' + ident + ']'
    console.log("selector set to ", selector)
    await page.locator(selector).fill(text)
  }

  async screenshot(page: Page, folder: string, name: string) {
    await page.screenshot({ path: 'e2e/screenshots/'+folder+'/'+name, clip: {x:0, y:0, width:1280, height:800} });
  }

}
