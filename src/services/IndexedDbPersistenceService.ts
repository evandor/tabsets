import {IDBPDatabase, openDB} from "idb";
import {useTabsStore} from "stores/tabsStore";
import _ from "lodash";
import {INDEX_DB_NAME} from "boot/constants";
import PersistenceService from "src/services/PersistenceService";
import {Tabset} from "src/models/Tabset";

class IndexedDbPersistenceService implements PersistenceService {

  private db: IDBPDatabase = null as unknown as IDBPDatabase

  async init() {
    this.db = await this.initDatabase()
  }

  async loadTabsets(): Promise<void> {
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

  async saveTabset(tabset: Tabset): Promise<IDBValidKey> {
    return await this.db.put('tabsets', JSON.parse(JSON.stringify(tabset)), tabset.id);
  }

  deleteTabset(tabsetId: string): Promise<void> {
    return this.db.delete('tabsets', tabsetId)
  }

  private async initDatabase(): Promise<IDBPDatabase> {
    return await openDB(INDEX_DB_NAME, 2, {
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


  async updateContent(url: string) {
    let content = ''
    let description = ''
    const encodedUrl = btoa(url)

    const objectStore = this.db.transaction("content", "readwrite").objectStore("content");
    let cursor = await objectStore.openCursor()
    while (cursor) {
      //console.log("cursor", cursor.value, encodedUrl)
      if (cursor.value.expires !== 0 && cursor.value.id === encodedUrl) {
        const data = cursor.value
        objectStore.put({
            id: data.id,
            expires: 0,
            content: data.content,
            metas: data.metas,
            title: data.title,
            url: data.url,
            tabsets: data.tabsets,
            favIconUrl: data.favIconUrl
          },
          cursor.key)

        content = data.content
        Object.keys(data.metas).forEach((key: string) => {
          if (key.indexOf("description") >= 0 && data.metas[key] && data.metas[key].trim().length > description.length) {
            //console.log("updating description to ", data.metas[key].trim())
            description = data.metas[key].trim()
          }
        })
      }
      cursor = await cursor.continue();
    }
  }

  async updateThumbnail(url: string) {
    const encodedUrl = btoa(url)
    const tnObjectStore = this.db.transaction("thumbnails", "readwrite").objectStore("thumbnails");
    let tnCursor = await tnObjectStore.openCursor()
    while (tnCursor) {
      //console.log("cursor", tnCursor.value, encodedUrl)
      if (tnCursor.value.expires !== 0 && tnCursor.key === encodedUrl) {
        const data = tnCursor.value
        tnObjectStore.put({
            expires: 0,
            thumbnail: data.thumbnail
          },
          tnCursor.key)
      }
      tnCursor = await tnCursor.continue();
    }
  }

  saveThumbnail(url: string, thumbnail: string) {
    const encodedTabUrl = btoa(url)
    return this.db.put('thumbnails', {expires: new Date().getTime() + 1000 * 60 * 60, thumbnail: thumbnail}, encodedTabUrl)
      .then(ts => console.log("added thumbnail"))
      .catch(err => console.log("err", err))
  }

  async getThumbnail(url: string) {
    const encodedUrl = btoa(url)
    return await this.db.get('thumbnails', encodedUrl)
  }

  async getContent(url: string) {
    const encodedUrl = btoa(url)
    return await this.db.get('content', encodedUrl)
  }

  deleteThumbnail(url: string) {
    return this.db.delete('thumbnails', btoa(url))
  }

  deleteContent(url: string) {
    return this.db.delete('content', btoa(url))
  }

  saveContent(tab: chrome.tabs.Tab, text: string, metas: object, title: string, tabsetIds: string[]) {
    if (tab.url) {
      const encodedTabUrl = btoa(tab.url)
      return this.db.put('content', {
        id: encodedTabUrl,
        expires: new Date().getTime() + 1000 * 60 * 60,
        title,
        url: tab.url,
        content: text,
        metas: metas,
        tabsets: tabsetIds,
        favIconUrl: tab.favIconUrl
      }, encodedTabUrl)
    }
    return Promise.reject("tab.url missing")
  }

  async cleanUpThumbnails() {
    const objectStore = this.db.transaction("thumbnails", "readwrite").objectStore("thumbnails");
    let cursor = await objectStore.openCursor()
    while (cursor) {
      if (cursor.value.expires !== 0) {
        const exists: boolean = this.urlExistsInATabset(atob(cursor.key.toString()))
        if (exists) {
          objectStore.put({expires: 0, thumbnail: cursor.value.thumbnail}, cursor.key)
        } else {
          if (cursor.value.expires < new Date().getTime()) {
            objectStore.delete(cursor.key)
          }
        }
      }
      cursor = await cursor.continue();
    }
  }

  private urlExistsInATabset(url: string): boolean {
    //console.log("checking url", url)
    for (let ts of [...useTabsStore().tabsets.values()]) {
      if (_.find(ts.tabs, t => t.chromeTab.url === url)) {
        return true;
      }
    }
    return false;
  }

  async cleanUpContent() {
    const contentObjectStore = this.db.transaction("content", "readwrite").objectStore("content");
    let contentCursor = await contentObjectStore.openCursor()
    while (contentCursor) {
      if (contentCursor.value.expires !== 0) {
        const exists: boolean = this.urlExistsInATabset(atob(contentCursor.key.toString()))
        if (exists) {
          const data = contentCursor.value
          contentObjectStore.put({
              id: data.id,
              expires: 0,
              content: data.content,
              title: data.title,
              url: data.url,
              tabsets: data.tabsets,
              favIconUrl: data.favIconUrl
            },
            contentCursor.key)
        } else {
          if (contentCursor.value.expires < new Date().getTime()) {
            contentObjectStore.delete(contentCursor.key)
          }
        }
      }
      contentCursor = await contentCursor.continue();
    }
  }

  getContents() {
    return this.db.getAll('content')
  }
}

export default new IndexedDbPersistenceService()
