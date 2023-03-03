import {expect, Locator, Page} from "@playwright/test";
import {TabsetPage} from "app/e2e/TabsetPage";

export class TabsetTestPage extends TabsetPage {

  readonly page: Page;
  private extensionId: string;
  public skysailTabcardWidget: Locator;
  public heiseTabcardWidget: Locator;
  // private newTabsetName: Locator;
  // private newTabsetNameSubmit: Locator;
  // private addUrlButton: Locator;
  // private addUrlDialogSubmit: Locator;
  // private newTabsetAutoAdd: Locator;

  constructor(page: Page, extensionId: string) {
    super();
    this.page = page;
    this.extensionId = extensionId;
    expect(page).toHaveURL(/.*\/tabsets\//);
    this.skysailTabcardWidget = page.locator('[data-testid=tabListElementWidget_wwwskysailio]')
    this.heiseTabcardWidget = page.locator('[data-testid=tabListElementWidget_wwwheisede]')
    // this.newTabsetName = page.locator('[data-testid=newTabsetName]')
    // this.newTabsetNameSubmit = page.locator('[data-testid=newTabsetNameSubmit]')
    // this.addUrlButton = page.locator('[text="Add Url..."]')
    // this.addUrlDialogSubmit = page.locator('[data-testid=add_url_input]')
    // this.newTabsetAutoAdd = page.locator('[data-testid=newTabsetAutoAdd]')
  }

  async goto() {
    // await this.page.goto(`chrome-extension://${this.extensionId}/www/index.html`);
    // await this.page.waitForSelector('[data-testid=createFirstTabsetBtn]')
    // await expect(this.page.locator('text=Add new Tabset')).not.toBeVisible()
  }


  async waitForAndGetPendingTab(ident: string) {
    await this.page.waitForSelector('[data-testid=openTabCard_'+ident+']')
    return this.page.locator('[data-testid=openTabCard_'+ident+']')
  }
}
