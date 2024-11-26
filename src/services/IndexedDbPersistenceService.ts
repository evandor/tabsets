import {IDBPDatabase, openDB} from "idb";
import _ from "lodash";
import {INDEX_DB_VERSION} from "boot/constants";
import PersistenceService from "src/services/PersistenceService";
import {MetaLink} from "src/models/MetaLink";
import {useUiStore} from "src/ui/stores/uiStore";
import {useTabsetsStore} from "src/tabsets/stores/tabsetsStore";

// Deprecated
class IndexedDbPersistenceService implements PersistenceService {
  private db: IDBPDatabase = null as unknown as IDBPDatabase

  getServiceName(): string {
    return "IndexedDbPersistenceService"
  }

  async init(dbName: string) {
    // console.debug(" ...initializing indexeddb database", dbName)
    this.db = await this.initDatabase(dbName)
    useUiStore().dbReady = true
  }

  async cleanUpRequests(): Promise<void> {
    return Promise.reject("not implemented C")
  }

  async cleanUpMetaLinks(): Promise<void> {
    return Promise.reject("not implemented D")
  }

  async cleanUpLinks(): Promise<void> {
    return Promise.reject("not implemented E")
  }

  async cleanUpExpired(tableName: string): Promise<void> {
    return Promise.reject("not implemented F")
  }

  /** messages **/


  private async initDatabase(dbName: string): Promise<IDBPDatabase> {
    console.debug(" ...about to initialize indexedDB")
    return await openDB(dbName, INDEX_DB_VERSION, {
      // upgrading see https://stackoverflow.com/questions/50193906/create-index-on-already-existing-objectstore
      upgrade(db) {
        if (db.objectStoreNames.contains('tabsets')) {
          db.deleteObjectStore('tabsets')
        }
        if (db.objectStoreNames.contains('spaces')) {
          db.deleteObjectStore('spaces');
        }
        if (db.objectStoreNames.contains('mhtml')) {
          db.deleteObjectStore('mhtml');
        }
        if (db.objectStoreNames.contains('requests')) {
          db.deleteObjectStore('requests');
        }
        if (db.objectStoreNames.contains('metalinks')) {
          db.deleteObjectStore('metalinks');
        }
        if (db.objectStoreNames.contains('links')) {
          db.deleteObjectStore('links');
        }
        if (db.objectStoreNames.contains('notifications')) {
          db.deleteObjectStore('notifications');
        }
        if (db.objectStoreNames.contains('suggestions')) {
          db.deleteObjectStore('suggestions');
        }
        if (db.objectStoreNames.contains('blobs')) {
          db.deleteObjectStore('blobs');
        }
        if (db.objectStoreNames.contains('groups')) {
          db.deleteObjectStore('groups');
        }
        if (db.objectStoreNames.contains('messages')) {
          db.deleteObjectStore('messages');
        }
        if (db.objectStoreNames.contains('accounts')) {
          db.deleteObjectStore('accounts');
        }
        if (db.objectStoreNames.contains('entities')) {
          db.deleteObjectStore('entities');
        }
        if (db.objectStoreNames.contains('apis')) {
          db.deleteObjectStore('apis');
        }
      },
    });
  }

  compactDb(): Promise<any> {
    return Promise.resolve(undefined);
  }

  clear(name: string) {
    this.db.clear(name).catch((e) => console.warn(e))
  }


}

export default new IndexedDbPersistenceService()
