import {expect, Locator, Page} from "@playwright/test";
import {TabsetPage} from "app/e2e/TabsetPage";
import {TabsetTestPage} from "app/e2e/TabsetTestPage";

export class AboutPage extends TabsetPage {

  readonly page: Page;
  private extensionId: string;
  private createFirstTabsetBtn: Locator;
  private newTabsetName: Locator;
  private newTabsetNameSubmit: Locator;
  private addUrlButton: Locator;
  private addUrlDialogSubmit: Locator;
  private submitUrlDialogSubmit: Locator;
  private newTabsetAutoAdd: Locator;

  constructor(page: Page, extensionId:string) {
    super();
    this.page = page;
    this.extensionId = extensionId;
    this.createFirstTabsetBtn = page.locator('[data-testid=createFirstTabsetBtn]')
    this.newTabsetName = page.locator('[data-testid=newTabsetName]')
    this.newTabsetNameSubmit = page.locator('[data-testid=newTabsetNameSubmit]')
    this.addUrlButton = page.locator('[text="Add Url..."]')
    this.addUrlDialogSubmit = page.locator('[data-testid=add_url_input]')
    this.submitUrlDialogSubmit = page.locator('[data-testid=add_url_submit]')
    this.newTabsetAutoAdd = page.locator('[data-testid=newTabsetAutoAdd]')
  }

  async goto() {
    await this.page.goto(`chrome-extension://${this.extensionId}/www/index.html`);
    await this.page.waitForSelector('[data-testid=createFirstTabsetBtn]')
    await expect(this.page.locator('text=Add new Tabset')).not.toBeVisible()
  }

  async submitNewTabsetDialog(tabsetName: string): Promise<TabsetTestPage> {
    await this.createFirstTabsetBtn.click()
    await this.newTabsetName.fill(tabsetName)
    await this.newTabsetAutoAdd.uncheck()
    await this.fillByTestId(this.page, 'newTabsetName', tabsetName)
    await this.newTabsetNameSubmit.click()
    return new TabsetTestPage(this.page, this.extensionId)
  }

  async submitAddUrlDialog(url: string): Promise<TabsetTestPage> {
    await this.screenshot(this.page, 'addTabset','beforeAddUrl.png');
    await this.page.waitForSelector('text="Add Url..."')
    await this.page.locator('text="Add Url..."').click()
    await this.addUrlDialogSubmit.fill(url)
    await this.screenshot(this.page, 'addTabset','afterAddUrl.png');
    await this.submitUrlDialogSubmit.click()
    return new TabsetTestPage(this.page, this.extensionId)
  }
}
