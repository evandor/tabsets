import {IDBPDatabase, openDB, deleteDB} from "idb";
import _ from "lodash";
import {EXPIRE_DATA_PERIOD_IN_MINUTES, INDEX_DB_VERSION} from "boot/constants";
import PersistenceService from "src/services/PersistenceService";
import {Tabset, TabsetStatus} from "src/tabsets/models/Tabset";
import {MetaLink} from "src/models/MetaLink";
import {uid} from "quasar";
import {Notification, NotificationStatus} from "src/models/Notification";
import {Suggestion, SuggestionState, SuggestionType} from "src/suggestions/models/Suggestion";
import {useUiStore} from "src/ui/stores/uiStore";
import {RequestInfo} from "src/models/RequestInfo";
import {useSuggestionsStore} from "src/suggestions/stores/suggestionsStore";
import {useTabsetsStore} from "src/tabsets/stores/tabsetsStore";

class IndexedDbPersistenceService implements PersistenceService {
  private db: IDBPDatabase = null as unknown as IDBPDatabase

  getServiceName(): string {
    return "IndexedDbPersistenceService"
  }

  async init(dbName: string) {
    console.debug(" ...initializing indexeddb database", dbName)
    this.db = await this.initDatabase(dbName)
    useUiStore().dbReady = true
  }

  async loadTabsets(): Promise<any> {
    console.debug(" ...loading tabsets indexeddb")
    return await this.db.getAll('tabsets')
      .then((res: any) => res.forEach((r: Tabset) => {
        // make sure some fields are correctly initialized even for old(er) tabsets
        if (!r.columns) {
          r.columns = []
        }
        delete r['groups' as keyof object]
        //console.log("r", ['groups' as keyof object])
        useTabsetsStore().addTabset(r)
      }))
  }

  async saveTabset(tabset: Tabset): Promise<IDBValidKey> {
    return await this.db.put('tabsets', JSON.parse(JSON.stringify(tabset)), tabset.id);
  }

  saveRequest(url: string, requestInfo: RequestInfo): Promise<void> {
    const encodedTabUrl = btoa(url)
    return this.db.put('requests', {
      expires: new Date().getTime() + 1000 * 60 * EXPIRE_DATA_PERIOD_IN_MINUTES,
      url: url,
      requestInfo
    }, encodedTabUrl)
      .then(() => {
        console.debug("added request", requestInfo)
        if (requestInfo.statusCode.toString().startsWith("30") && requestInfo.headers.length > 0) {
          const suggestionId = uid()
          const suggestion = new Suggestion(suggestionId,
            "Tab URL changed", "A tab's URL has changed according to the server. Should the url be updated?",
            "/suggestions/" + suggestionId,
            SuggestionType.REDIRECT_HAPPENED_FOR_BOOKMARK)
          let location = undefined
          requestInfo.headers.forEach(headerObject => {
            //console.log("checking", headerObject.name.toLowerCase())
            if (headerObject.name.toLowerCase() === 'location') {
              location = headerObject.value
            }
          })
          console.log("location", location)
          if (location) {
            suggestion.setData({
              url,
              status: requestInfo.statusCode,
              location
            })
            useSuggestionsStore().addSuggestion(suggestion).catch((err) => {
              console.log("got error", err)
            })
          }
        }
      })
      .catch(err => console.log("err", err))
  }

  saveMetaLinks(url: string, metaLinks: MetaLink[]): Promise<void | IDBValidKey> {
    if (!this.db) {
      console.log("saveMetaLinks: db not ready yet")
    }
    const encodedTabUrl = btoa(url)
    return this.db.put('metalinks', {
      expires: new Date().getTime() + 1000 * 60 * EXPIRE_DATA_PERIOD_IN_MINUTES,
      url: url,
      metaLinks
    }, encodedTabUrl)
      //.then(() => console.debug("added meta links"))
      .catch(err => console.log("err", err))
  }

  saveLinks(url: string, links: any): Promise<void | IDBValidKey> {
    if (!this.db) {
      console.log("saveLinks: db not ready yet")
    }
    const encodedTabUrl = btoa(url)
    return this.db.put('links', {
      expires: new Date().getTime() + 1000 * 60 * EXPIRE_DATA_PERIOD_IN_MINUTES,
      url: url,
      links
    }, encodedTabUrl)
      //.then(() => console.debug("added links"))
      .catch(err => console.log("err", err))
  }

  getRequest(url: string): Promise<string> {
    const encodedUrl = btoa(url)
    return this.db.get('requests', encodedUrl)
  }

  getMetaLinks(url: string): Promise<object> {
    const encodedUrl = btoa(url)
    return this.db.get('metalinks', encodedUrl)
  }

  getLinks(url: string): Promise<object> {
    const encodedUrl = btoa(url)
    return this.db.get('links', encodedUrl)
  }

  async cleanUpTabsets(): Promise<void> {
    const objectStore = this.db.transaction("tabsets", "readwrite").objectStore("tabsets");
    let cursor = await objectStore.openCursor()
    while (cursor) {
      if (cursor.value.status === TabsetStatus.DELETED) {
        console.log("cleanup: deleteing stale tabset", cursor.key)
        objectStore.delete(cursor.key)
      }
      cursor = await cursor.continue();
    }
  }


  async cleanUpRequests(): Promise<void> {
    return this.cleanUpExpired('requests')
  }

  async cleanUpMetaLinks(): Promise<void> {
    return this.cleanUpExpired('metalinks')
  }

  async cleanUpLinks(): Promise<void> {
    return this.cleanUpExpired('links')
  }

  async cleanUpExpired(tableName: string): Promise<void> {
    const objectStore = this.db.transaction(tableName, "readwrite").objectStore(tableName);
    let cursor = await objectStore.openCursor()
    while (cursor) {
      if (cursor.value.expires !== 0) {
        const exists: boolean = this.urlExistsInATabset(atob(cursor.key.toString()))
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
      cursor = await cursor.continue();
    }
  }

  /** messages **/


  private async initDatabase(dbName: string): Promise<IDBPDatabase> {
    console.debug(" ...about to initialize indexedDB")
    return await openDB(dbName, INDEX_DB_VERSION, {
      // upgrading see https://stackoverflow.com/questions/50193906/create-index-on-already-existing-objectstore
      upgrade(db) {
        if (!db.objectStoreNames.contains('tabsets')) {
          console.log("creating db tabsets")
          db.createObjectStore('tabsets');
        }
        if (!db.objectStoreNames.contains('spaces')) {
          console.log("creating db spaces")
          db.createObjectStore('spaces');
        }
        if (!db.objectStoreNames.contains('mhtml')) {
          console.log("creating db mhtml")
          db.createObjectStore('mhtml');
        }
        if (!db.objectStoreNames.contains('requests')) {
          console.log("creating db requests")
          let store = db.createObjectStore('requests');
          store.createIndex("expires", "expires", {unique: false});
        }
        if (!db.objectStoreNames.contains('metalinks')) {
          console.log("creating db metalinks")
          const store = db.createObjectStore('metalinks');
          store.createIndex("expires", "expires", {unique: false});
        }
        if (!db.objectStoreNames.contains('links')) {
          console.log("creating db links")
          const store = db.createObjectStore('links');
          store.createIndex("expires", "expires", {unique: false});
        }
        if (!db.objectStoreNames.contains('notifications')) {
          console.log("creating db notifications")
          db.createObjectStore('notifications');
        }
        if (!db.objectStoreNames.contains('suggestions')) {
          console.log("creating db suggestions")
          db.createObjectStore('suggestions');
        }
        if (!db.objectStoreNames.contains('blobs')) {
          console.log("creating blobs suggestions")
          db.createObjectStore('blobs');
        }
        if (!db.objectStoreNames.contains('groups')) {
          console.log("creating db groups")
          db.createObjectStore('groups');
        }
        if (!db.objectStoreNames.contains('messages')) {
          console.log("creating db messages")
          db.createObjectStore('messages');
        }
        if (!db.objectStoreNames.contains('accounts')) {
          console.log("creating db accounts")
          db.createObjectStore('accounts');
        }
        if (!db.objectStoreNames.contains('entities')) {
          console.log("creating db entities")
          db.createObjectStore('entities');
        }
        if (!db.objectStoreNames.contains('apis')) {
          console.log("creating db apis")
          db.createObjectStore('apis');
        }
      },
    });
  }

  private urlExistsInATabset(url: string): boolean {
    for (let ts of [...useTabsetsStore().tabsets.values()]) {
      if (_.find(ts.tabs, t => t.url === url)) {
        return true;
      }
    }
    return false;
  }

  getNotifications(onlyNew: boolean = true): Promise<Notification[]> {
    if (this.db) {
      return this.db.getAll('notifications')
    }
    console.log("db not ready yet, returning empty notification array")
    return Promise.resolve([])
  }

  addNotification(notification: Notification): Promise<void> {
    return this.db.add('notifications', notification, notification.id)
      .then(() => Promise.resolve())
  }

  notificationRead(notificationId: string): Promise<void> {
    const objectStore = this.db.transaction('notifications', 'readwrite').objectStore('notifications');
    return objectStore.get(notificationId)
      .then(res => {
        res.status = NotificationStatus.READ
        res.updated = new Date().getTime()
        objectStore.put(res, notificationId)
      })
  }

  compactDb(): Promise<any> {
    return Promise.resolve(undefined);
  }

  clear(name: string) {
    this.db.clear(name).catch((e) => console.warn(e))
  }

  getActiveFeatures(): Promise<string[]> {
    return Promise.reject("not implemented")
  }

  saveActiveFeatures(val: string[]): any {
    console.warn("not implemented")
  }


}

export default new IndexedDbPersistenceService()
