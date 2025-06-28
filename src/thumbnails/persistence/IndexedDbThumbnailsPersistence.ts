import { IDBPDatabase, openDB } from 'idb'
import ThumbnailsPersistence from 'src/thumbnails/persistence/ThumbnailsPersistence'

class IndexedDbThumbnailsPersistence implements ThumbnailsPersistence {
  private STORE_IDENT = 'thumbnails'

  private db: IDBPDatabase = null as unknown as IDBPDatabase

  getServiceName(): string {
    return this.constructor.name
  }

  async init() {
    this.db = await this.initDatabase()
    // console.debug(` ...initialized thumbnails: ${this.getServiceName()}`, '✅')
    return Promise.resolve()
  }

  private async initDatabase(): Promise<IDBPDatabase> {
    const ctx = this
    return await openDB('thumbnailsDB', 1, {
      upgrade(db) {
        if (!db.objectStoreNames.contains(ctx.STORE_IDENT)) {
          console.log('creating db ' + ctx.STORE_IDENT)
          let store = db.createObjectStore(ctx.STORE_IDENT)
          store.createIndex('expires', 'expires', { unique: false })
        }
      },
    })
  }

  compactDb(): Promise<any> {
    return Promise.resolve(undefined)
  }

  async cleanUpThumbnails(fnc: (url: string) => boolean): Promise<void> {
    return this.cleanUpExpired(fnc)
  }

  // TODO remove expires logic
  async saveThumbnail(tabId: string, tabsetId: string, thumbnail: string): Promise<void> {
    return this.db
      .put(this.STORE_IDENT, thumbnail, tabId)
      .then(() => {
        //console.debug(new Tab(uid(), tab), `saved thumbnail for url ${tab.url}, ${Math.round(thumbnail.length / 1024)}kB`)
      })
      .catch((err) => console.error(err))
  }

  getThumbnail(tabId: string, userId: string): Promise<string> {
    return this.db.get(this.STORE_IDENT, tabId)
  }

  deleteThumbnail(tabId: string): Promise<void> {
    return this.db.delete(this.STORE_IDENT, tabId)
  }

  private async cleanUpExpired(fnc: (url: string) => boolean): Promise<void> {
    const objectStore = this.db.transaction(this.STORE_IDENT, 'readwrite').objectStore(this.STORE_IDENT)
    let cursor = await objectStore.openCursor()
    while (cursor) {
      if (cursor.value.expires !== 0) {
        const exists: boolean = fnc(atob(cursor.key as string))
        console.log('ran exists function', exists, atob(cursor.key as string))
        if (exists) {
          const data = cursor.value
          data.expires = 0
          objectStore.put(data, cursor.key)
        } else {
          if (cursor.value.expires < new Date().getTime()) {
            objectStore.delete(cursor.key)
          }
        }
      }
      cursor = await cursor.continue()
    }
  }
}

export default new IndexedDbThumbnailsPersistence()
