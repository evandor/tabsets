import { expect, Locator, Page } from '@playwright/test'
// @ts-expect-error TODO
import { TabsetPageDefinition } from 'e2e/TabsetPageDefinition'

export class SidePanelPageDefinition extends TabsetPageDefinition {
  readonly page: Page
  private readonly extensionId: string
  private saveInTabsetBtn: Locator

  constructor(page: Page, extensionId: string) {
    super()
    this.page = page
    this.extensionId = extensionId
    this.saveInTabsetBtn = page.locator('[data-testid=saveInTabsetBtn]')
  }

  async goto() {
    await this.page.goto(`chrome-extension://${this.extensionId}/www/index.html#/sidepanel`)
    await this.page.waitForSelector('[data-testid=addTabsetBtn]')
    //await expect(this.page.locator('text=Add new Tabset')).not.toBeVisible()
  }

  async addToTabset() {
    //const btn = await this.page.waitForSelector('[data-testid=startAddingTabsBtn]')
    const btn = await this.page.waitForSelector('[data-testid=saveInTabsetBtn]')
    // await this.saveInTabsetBtn.click()
    await btn.click()
  }
}
