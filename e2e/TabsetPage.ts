import {Page} from "@playwright/test";

export class TabsetPage {


  clickByText(page: Page, strings: string[]) {
    strings.forEach(s => {
      const selector = 'text=' + s
      console.log("selector set to ", selector)
      page.locator(selector).click()
    })
  }

  clickByTestId(page: Page, strings: string[]) {
    strings.forEach(s => {
      const selector = '[data-testid=' + s + ']'
      console.log("selector set to ", selector)
      page.locator(selector).click()
    })
  }

  async fillByTestId(page: Page, ident: string, text: string) {
    const selector = '[data-testid=' + ident + ']'
    console.log("selector set to ", selector)
    await page.locator(selector).fill(text)
  }

  async screenshot(page: Page, folder: string, name: string) {
    await page.screenshot({ path: 'e2e/screenshots/'+folder+'/'+name, clip: {x:0, y:0, width:1280, height:800} });
  }

}
