import {IDBPDatabase, openDB, deleteDB} from "idb";
import _, {keys} from "lodash";
import TabsetsPersistence from "src/tabsets/persistence/TabsetsPersistence";
import {Tabset} from "src/tabsets/models/Tabset";
import {useTabsetsStore} from "src/tabsets/stores/tabsetsStore";

class IndexedDbTabsetsPersistence implements TabsetsPersistence {

  private STORE_IDENT = 'tabsets';

  private db: IDBPDatabase = null as unknown as IDBPDatabase

  getServiceName(): string {
    return "IndexedDbTabsetsStorage";
  }

  async init() {
    console.log(" ...initializing tabsets (IndexedDbSpacesStorage)" )
    this.db = await this.initDatabase()
    return Promise.resolve()
  }

  private async initDatabase(): Promise<IDBPDatabase> {
    console.debug(" about to initialize indexedDB (Tabsets)")
    const ctx = this
    return await openDB("tabsetsDB", 1, {
      // upgrading see https://stackoverflow.com/questions/50193906/create-index-on-already-existing-objectstore
      upgrade(db) {
        if (!db.objectStoreNames.contains(ctx.STORE_IDENT)) {
          console.log("creating db " + ctx.STORE_IDENT)
          db.createObjectStore(ctx.STORE_IDENT);
        }
      }
    });
  }

  async loadTabsets(): Promise<any> {
    console.debug(" loading tabsets...")
    const keys: IDBValidKey[] = await this.db.getAllKeys(this.STORE_IDENT)
    _.forEach(keys, key => {
      this.db.get(this.STORE_IDENT, key)
        .then((ts: Tabset) => {
          useTabsetsStore().setTabset(ts)
        })
        .catch(err => console.log("err", err))
    })
  }

  compactDb(): Promise<any> {
    return Promise.resolve(undefined);
  }

  addTabset(ts: Tabset): Promise<any> {
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
    const oldDB = await openDB("db")
    const oldTabsets = await oldDB.getAll('tabsets')
    for(const oldTs of oldTabsets) {
      const optionalTsInNewDb = await this.db.get(this.STORE_IDENT, oldTs.id) as Tabset | undefined
      if (!optionalTsInNewDb) {
        console.log("migrating old tabset", oldTs.id, oldTs.name)
        await this.db.add(this.STORE_IDENT, oldTs, oldTs.id)
      }
    }
  }

}

export default new IndexedDbTabsetsPersistence()
