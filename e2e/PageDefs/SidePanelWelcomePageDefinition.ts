import {expect, Locator, Page} from "@playwright/test";
// @ts-ignore
import {TabsetPageDefinition} from "app/e2e/TabsetPageDefinition";
// @ts-ignore
import {SidePanelPageDefinition} from "app/e2e/PageDefs/SidePanelPageDefinition";

export class SidePanelWelcomePageDefinition extends TabsetPageDefinition {

  readonly page: Page;
  private extensionId: string;
  private addTabsetSubmitBtn: Locator;
  private newTabsetName: Locator;

  constructor(page: Page, extensionId:string) {
    super();
    this.page = page;
    this.extensionId = extensionId;
    this.addTabsetSubmitBtn = page.locator('[data-testid=addTabsetSubmitBtn]')
    this.newTabsetName = page.locator('[data-testid=newTabsetName]')
  }

  async goto() {
    const url = `chrome-extension://${this.extensionId}/www/index.html#/sidepanel/welcome`
    console.log("going to ", url)
    await this.page.goto(url);
    await this.page.waitForSelector('[data-testid=newTabsetName]')
    //await expect(this.page.locator('text=Add')).not.toBeVisible()
  }

  async submitNewTabsetDialog(tabsetName: string) {
    console.log("page url 1", this.page.url())
    await this.newTabsetName.fill(tabsetName)
    await this.addTabsetSubmitBtn.click()
    //await delay(2000)
    console.log(`checking for chrome-extension://${this.extensionId}/www/index.html#/sidepanel`)
    await this.page.waitForURL("**\/sidepanel**")
    console.log("page url 2", this.page.url())
    //return Promise.resolve(new SidePanelPageDefinition(this.page, this.extensionId))
  }

  // async submitAddUrlDialog(url: string): Promise<TabsetTestPage> {
  //   await this.screenshot(this.page, 'addTabset','beforeAddUrl.png');
  //   await this.addUrlDialogBtn.click()
  //   //await this.page.waitForSelector('text="NEW TAB"')
  //   //await this.page.locator('text="NEW TAB"').click()
  //   await this.addUrlDialogSubmit.fill(url)
  //   await this.screenshot(this.page, 'addTabset','afterAddUrl.png');
  //   await this.submitUrlDialogSubmit.click()
  //   return new TabsetTestPage(this.page, this.extensionId)
  // }
}
