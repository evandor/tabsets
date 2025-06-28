import { IDBPDatabase, openDB } from 'idb'
import { useUtils } from 'src/core/services/Utils'
import { Page } from 'src/tabsets/models/cms/backend'
import CustomPagesPersistence from 'src/tabsets/persistence/cms/CustomPagesPersistence'

const { getMinimalJSON } = useUtils()

class IndexedDbCustomPagesPersistence implements CustomPagesPersistence {
  private STORE_IDENT = 'pages'

  private db: IDBPDatabase = null as unknown as IDBPDatabase

  getServiceName(): string {
    return 'IndexedDbCustomPagesStorage'
  }

  async init() {
    this.db = await this.initDatabase()
    // console.debug(` ...initialized spaces: ${this.getServiceName()}`, '✅')
    return Promise.resolve()
  }

  private async initDatabase(): Promise<IDBPDatabase> {
    const ctx = this
    return await openDB('pagesDB', 1, {
      // upgrading see https://stackoverflow.com/questions/50193906/create-index-on-already-existing-objectstore
      upgrade(db) {
        if (!db.objectStoreNames.contains(ctx.STORE_IDENT)) {
          console.log('creating db ' + ctx.STORE_IDENT)
          let store = db.createObjectStore(ctx.STORE_IDENT)
          store.createIndex('tabsetId', 'tabsetId', { unique: false })
        }
      },
    })
  }

  async addPage(page: Page): Promise<any> {
    var json = getMinimalJSON(page)
    // console.log('adding page', json)
    return await this.db.put(this.STORE_IDENT, JSON.parse(json) as Page, page.id).then(() => Promise.resolve())
  }

  deletePage(pageId: string): Promise<void> {
    return this.db.delete(this.STORE_IDENT, pageId)
  }

  loadPage(pageId: string): Promise<Page> {
    return this.db.get(this.STORE_IDENT, pageId)
  }

  loadPages(tabsetId: string): Promise<Page[]> {
    return this.db.getAllFromIndex(this.STORE_IDENT, 'tabsetId', tabsetId)
    // return this.db.get(this.STORE_IDENT, pageId)
  }

  compactDb(): Promise<any> {
    return Promise.resolve(undefined)
  }

  clear(name: string) {
    this.db.clear(name).catch((e) => console.warn(e))
  }

  async migrate() {}
}

export default new IndexedDbCustomPagesPersistence()
