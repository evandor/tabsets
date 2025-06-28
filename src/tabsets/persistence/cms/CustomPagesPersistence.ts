import { Page } from 'src/tabsets/models/cms/backend'

interface CustomPagesPersistence {
  getServiceName(): string

  init(): Promise<any>

  loadPage(pageId: string): Promise<Page>
  loadPages(tabsetId: string): Promise<Page[]>
  addPage(page: Page): Promise<any>
  deletePage(pageId: string): Promise<void>

  // optional migration code for 0.4.11 to 0.5.0
  //migrate(): any

  compactDb(): Promise<any>
  clear(name: string): void
}

export default CustomPagesPersistence
