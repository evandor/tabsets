import {expect, Locator, Page} from "@playwright/test";
import {TabsetPageDefinition} from "app/e2e/TabsetPageDefinition";
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

}
