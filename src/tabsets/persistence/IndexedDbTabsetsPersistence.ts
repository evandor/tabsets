// 3 expected diffs to localstorage
import { IDBPDatabase, openDB } from 'idb'
import { useDB } from 'src/services/usePersistenceService'
import { SharingInfo } from 'src/tabsets/models/SharingInfo'
import { Tabset, TabsetSharing } from 'src/tabsets/models/Tabset'
import TabsetsPersistence from 'src/tabsets/persistence/TabsetsPersistence'
import { useTabsetsStore } from 'src/tabsets/stores/tabsetsStore'

class IndexedDbTabsetsPersistence implements TabsetsPersistence {
  private STORE_IDENT = 'tabsets'

  private db: IDBPDatabase = null as unknown as IDBPDatabase

  getServiceName(): string {
    return this.constructor.name
  }

  async init() {
    this.db = await this.initDatabase()
    // console.debug(` ...initialized tabsets: ${this.getServiceName()}`, '✅')
    return Promise.resolve()
  }

  private async initDatabase(): Promise<IDBPDatabase> {
    const ctx = this
    return await openDB('tabsetsDB', 1, {
      // upgrading see https://stackoverflow.com/questions/50193906/create-index-on-already-existing-objectstore
      upgrade(db) {
        if (!db.objectStoreNames.contains(ctx.STORE_IDENT)) {
          console.log('creating db ' + ctx.STORE_IDENT)
          db.createObjectStore(ctx.STORE_IDENT)
        }
      },
    })
  }

  async loadTabsets(): Promise<any> {
    const tabsets = await this.db.getAll('tabsets')
    tabsets.forEach((ts: Tabset) => {
      // adapt older tabsets
      if (!ts.sharing) {
        ts.sharing = new SharingInfo()
      }
      useTabsetsStore().setTabset(ts)
    })
    //console.log(' ...loaded tabsets, found ', useTabsetsStore().tabsets.size)
    return Promise.resolve()
  }

  async reloadTabset(tabsetId: string): Promise<Tabset> {
    console.debug(`reloading tabset ${tabsetId.substring(0, 8)}`)
    return await this.db.get('tabsets', tabsetId)
  }

  compactDb(): Promise<any> {
    return Promise.resolve(undefined)
  }

  addTabset(ts: Tabset): Promise<any> {
    //console.log("adding tabset", ts)
    return this.db.add(this.STORE_IDENT, ts, ts.id)
  }

  async saveTabset(ts: Tabset): Promise<any> {
    return await this.db.put(this.STORE_IDENT, ts, ts.id)
  }

  deleteTabset(tabsetId: string): Promise<any> {
    return this.db.delete(this.STORE_IDENT, tabsetId)
  }

  clear(name: string) {
    this.db.clear(name).catch((e) => console.warn(e))
  }

  async migrate() {
    // 0.4.11 - 0.5.0
    const oldDB = await openDB('db')
    if (!oldDB || !oldDB.objectStoreNames.contains(this.STORE_IDENT)) {
      return // no migration necessary, no old data
    }
    const oldTabsets = await oldDB.getAll('tabsets')
    for (const oldTs of oldTabsets) {
      const optionalTsInNewDb = (await this.db.get(this.STORE_IDENT, oldTs.id)) as Tabset | undefined
      if (!optionalTsInNewDb) {
        console.log('migrating old tabset', oldTs.id, oldTs.name)
        await this.db.add(this.STORE_IDENT, oldTs, oldTs.id)
      }
    }
  }

  share(
    tabset: Tabset,
    sharing: TabsetSharing,
    sharedId: string | undefined,
    sharedBy: string | undefined,
  ): Promise<TabsetSharing | void> {
    return Promise.reject('sharing not possible in local mode')
  }

  loadPublicTabset(sharedId: string): Promise<Tabset> {
    const useDb = useDB().tabsetsDb
    // delegate to cloud db
    return useDb.loadPublicTabset(sharedId, '???')
  }

  shareWith(
    tabset: Tabset,
    email: string,
    readonly: boolean,
    sharedBy: string | undefined,
  ): Promise<TabsetSharing | void> {
    return Promise.resolve(undefined)
  }
}

export default new IndexedDbTabsetsPersistence()
