import {IDBPDatabase, openDB} from "idb";
import {useTabsStore} from "stores/tabsStore";
import _ from "lodash";
import {INDEX_DB_NAME} from "boot/constants";
import PersistenceService from "src/services/PersistenceService";

class IndexedDbPersistenceService implements PersistenceService {

  private db: IDBPDatabase = null as unknown as IDBPDatabase

  constructor() {
    this.initDatabase()
      .then((db: IDBPDatabase) => this.db = db)
  }

  async loadTabsets() {
    const tabsStore = useTabsStore()
    const keys: IDBValidKey[] = await this.db.getAllKeys('tabsets')
    _.forEach(keys, key => {
      this.db.get('tabsets', key)
        .then(ts => {
          if ('ignored' === key) {
            tabsStore.ignoredTabset = ts//JSON.parse(ts)
          } else {
            tabsStore.addTabset(ts)//JSON.parse(ts))
          }
        })
        .catch(err => console.log("err", err))
    })
  }

  private async initDatabase(): Promise<IDBPDatabase> {
    return await openDB(INDEX_DB_NAME + "_2", 2, {
      // upgrading see https://stackoverflow.com/questions/50193906/create-index-on-already-existing-objectstore
      upgrade(db) {
        if (!db.objectStoreNames.contains('tabsets')) {
          console.log("creating db tabsets")
          db.createObjectStore('tabsets');
        }
        if (!db.objectStoreNames.contains('thumbnails')) {
          console.log("creating db thumbnails")
          let store = db.createObjectStore('thumbnails');
          store.createIndex("expires", "expires", {unique: false});
        }
        if (!db.objectStoreNames.contains('content')) {
          console.log("creating db content")
          let store = db.createObjectStore('content');
          store.createIndex("expires", "expires", {unique: false});
        }
        if (!db.objectStoreNames.contains('searchIndex')) {
          console.log("creating db searchIndex")
          let store = db.createObjectStore('searchIndex');
          store.createIndex("expires", "expires", {unique: false});
        }
      },
    });
  }

}

export default new IndexedDbPersistenceService()
