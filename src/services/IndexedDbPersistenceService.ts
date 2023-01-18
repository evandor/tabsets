import {IDBPDatabase, openDB} from "idb";
import {useTabsStore} from "src/stores/tabsStore";
import _ from "lodash";
import {INDEX_DB_NAME, INDEX_DB_VERSION, EXPIRE_DATA_PERIOD_IN_MINUTES} from "boot/constants";
import PersistenceService from "src/services/PersistenceService";
import {Tabset, TabsetStatus} from "src/models/Tabset";
import mhtml2html from 'mhtml2html';
import {useSpacesStore} from "stores/spacesStore";
import {Space} from "src/models/Space";
import {MHtml} from "src/models/MHtml";
import {Tab} from "src/models/Tab";
import {SearchDoc} from "src/models/SearchDoc";
import {RequestInfo} from "src/models/RequestInfo";
import {MetaLink} from "src/models/MetaLink";
import {LogEntry} from "src/models/LogEntry";
import {LogLevel} from "logging-library";
import {Predicate} from "src/domain/Types";
import {TabLogger} from "src/logging/TabLogger";
import {StatsEntry} from "src/models/StatsEntry";
import {uid} from "quasar";
import {Notification, NotificationStatus} from "src/models/Notification";

class IndexedDbPersistenceService implements PersistenceService {

  private db: IDBPDatabase = null as unknown as IDBPDatabase

  async init() {
    console.debug("initializing database")
    this.db = await this.initDatabase()
  }

  async loadTabsets(): Promise<any> {
    const tabsStore = useTabsStore()
    const keys: IDBValidKey[] = await this.db.getAllKeys('tabsets')
    const res: Promise<any>[] = _.map(keys, key => {
      return this.db.get('tabsets', key)
        .then(ts => {
          if ('ignored' === key) {
            tabsStore.ignoredTabset = ts
          } else {
            if (!ts.status) {
              ts.status = TabsetStatus.DEFAULT
            }
            tabsStore.addTabset(ts)
          }
        })
        .catch(err => console.log("err", err))
    })
    return Promise.all(res)
  }

  async loadSpaces(): Promise<void> {
    console.debug("loading spaes...")
    const spacesStore = useSpacesStore()
    const keys: IDBValidKey[] = await this.db.getAllKeys('spaces')
    _.forEach(keys, key => {
      this.db.get('spaces', key)
        .then((space: Space) => {
          spacesStore.putSpace(space)
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

  async updateContent(url: string): Promise<object> {
    const encodedUrl = btoa(url)

    const objectStore = this.db.transaction("content", "readwrite").objectStore("content");
    let cursor = await objectStore.openCursor()
    let data = null
    while (cursor) {
      if (cursor.value.id === encodedUrl) {
        data = cursor.value
        data['expires'] = 0
        objectStore.put(data, cursor.key)
      }
      cursor = await cursor.continue();
    }
    return Promise.resolve(data)
  }

  async updateThumbnail(url: string): Promise<void> {
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

  saveLog(context: string, level: LogLevel, msg: string, ...args: any[]): Promise<any> {
    if (this.db) {
      const store = this.db.transaction(["logs"], "readwrite")
        .objectStore("logs");
      return store.put({
        timestamp: new Date().getTime(),
        context,
        msg,
        level,
        args
      })
    }
    return Promise.reject("db not available (yet)")
  }

  saveThumbnail(tab: chrome.tabs.Tab, thumbnail: string): Promise<void> {
    if (tab.url) {
      const encodedTabUrl = btoa(tab.url)
      return this.db.put('thumbnails', {
        expires: new Date().getTime() + 1000 * 60 * EXPIRE_DATA_PERIOD_IN_MINUTES,
        thumbnail: thumbnail
      }, encodedTabUrl)
        .then(() => TabLogger.info(new Tab(uid(), tab), `saved thumbnail for url ${tab.url}, ${Math.round(thumbnail.length / 1024)}kB`))
        .catch(err => TabLogger.error(new Tab(uid(), tab), err))
    }
    return Promise.reject("no url provided")
  }

  saveRequest(url: string, requestInfo: RequestInfo): Promise<void> {
    const encodedTabUrl = btoa(url)
    return this.db.put('requests', {
      expires: new Date().getTime() + 1000 * 60 * EXPIRE_DATA_PERIOD_IN_MINUTES,
      url: url,
      requestInfo
    }, encodedTabUrl)
      .then(() => console.debug("added request"))
      .catch(err => console.log("err", err))
  }

  saveMetaLinks(url: string, metaLinks: MetaLink[]): Promise<void> {
    const encodedTabUrl = btoa(url)
    return this.db.put('metalinks', {
      expires: new Date().getTime() + 1000 * 60 * EXPIRE_DATA_PERIOD_IN_MINUTES,
      url: url,
      metaLinks
    }, encodedTabUrl)
      .then(() => console.debug("added meta links"))
      .catch(err => console.log("err", err))
  }

  saveLinks(url: string, links: any): Promise<void> {
    const encodedTabUrl = btoa(url)
    return this.db.put('links', {
      expires: new Date().getTime() + 1000 * 60 * EXPIRE_DATA_PERIOD_IN_MINUTES,
      url: url,
      links
    }, encodedTabUrl)
      .then(() => console.debug("added links"))
      .catch(err => console.log("err", err))
  }

  getThumbnail(url: string): Promise<string> {
    const encodedUrl = btoa(url)
    return this.db.get('thumbnails', encodedUrl)
  }

  getRequest(url: string): Promise<string> {
    const encodedUrl = btoa(url)
    return this.db.get('requests', encodedUrl)
  }

  getContent(url: string): Promise<object> {
    const encodedUrl = btoa(url)
    return this.db.get('content', encodedUrl)
  }

  deleteThumbnail(url: string): Promise<void> {
    return this.db.delete('thumbnails', btoa(url))
  }

  deleteContent(url: string): Promise<void> {
    return this.db.delete('content', btoa(url))
  }

  saveContent(tab: chrome.tabs.Tab, text: string, metas: object, title: string, tabsetIds: string[]): Promise<IDBValidKey> {
    if (tab.url) {
      const encodedTabUrl = btoa(tab.url)
      return this.db.put('content', {
        id: encodedTabUrl,
        expires: new Date().getTime() + 1000 * 60 * EXPIRE_DATA_PERIOD_IN_MINUTES,
        title,
        url: tab.url,
        content: text,
        metas: metas,
        tabsets: tabsetIds,
        favIconUrl: tab.favIconUrl
      }, encodedTabUrl)
        .then((res) => {
          TabLogger.info(new Tab(uid(), tab), "saved content for url " + tab.url)
          return res
        })
    }
    return Promise.reject("tab.url missing")
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

  async cleanUpThumbnails(): Promise<void> {
    return this.cleanUpExpired("thumbnails")
    // const objectStore = this.db.transaction("thumbnails", "readwrite").objectStore("thumbnails");
    // let cursor = await objectStore.openCursor()
    // while (cursor) {
    //   if (cursor.value.expires !== 0) {
    //     const exists: boolean = this.urlExistsInATabset(atob(cursor.key.toString()))
    //     if (exists) {
    //       objectStore.put({expires: 0, thumbnail: cursor.value.thumbnail}, cursor.key)
    //     } else {
    //       if (cursor.value.expires < new Date().getTime()) {
    //         objectStore.delete(cursor.key)
    //       }
    //     }
    //   }
    //   cursor = await cursor.continue();
    // }
  }

  async cleanUpRequests(): Promise<void> {
    return this.cleanUpExpired('requests')
    // const objectStore = this.db.transaction("requests", "readwrite").objectStore("requests");
    // let cursor = await objectStore.openCursor()
    // while (cursor) {
    //   if (cursor.value.expires !== 0) {
    //     const exists: boolean = this.urlExistsInATabset(atob(cursor.key.toString()))
    //     if (exists) {
    //       const data = cursor.value
    //       data.expires = 0
    //       objectStore.put(data, cursor.key)
    //     } else {
    //       if (cursor.value.expires < new Date().getTime()) {
    //         objectStore.delete(cursor.key)
    //       }
    //     }
    //   }
    //   cursor = await cursor.continue();
    // }
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

  async cleanUpContent(): Promise<SearchDoc[]> {
    const contentObjectStore = this.db.transaction("content", "readwrite").objectStore("content");
    let contentCursor = await contentObjectStore.openCursor()
    let result: SearchDoc[] = []
    while (contentCursor) {
      if (contentCursor.value.expires !== 0) {
        const exists: boolean = this.urlExistsInATabset(atob(contentCursor.key.toString()))
        if (exists) {
          const data = contentCursor.value
          data.expires = 0
          contentObjectStore.put(data, contentCursor.key)
          result.push(new SearchDoc(
            data.id, "", data.title, data.url, data.description, "", data.content, [], '', data.favIconUrl
          ))
        } else {
          if (contentCursor.value.expires < new Date().getTime()) {
            contentObjectStore.delete(contentCursor.key)
          }
        }
      }
      contentCursor = await contentCursor.continue();
    }
    return Promise.resolve(result)
  }

  getContents(): Promise<any[]> {
    return this.db.getAll('content')
  }

  saveMHtml(tab: Tab, mhtml: string): Promise<IDBValidKey> {
    if (tab.chromeTab.url) {
      const encodedTabUrl = btoa(tab.chromeTab.url)
      return this.db.put('mhtml', {
        id: encodedTabUrl,
        title: tab.name ? tab.name : tab.chromeTab.title,
        favIconUrl: tab.chromeTab.favIconUrl,
        url: tab.chromeTab.url,
        created: new Date().getTime(),
        content: mhtml
      }, encodedTabUrl)
    }
    return Promise.reject("tab.url missing")
  }

  async getMHtml(url: string): Promise<any> {

    console.log("getting mhtml for", url)
    const mhtml = await this.db.get('mhtml', url)
    console.log("got", mhtml.content, typeof mhtml.content)

    const content: Blob = mhtml.content

    const mhtmlString = await content.text()
    //console.log("mhtmlString", mhtmlString)
    const html = mhtml2html.convert(mhtmlString)//,{ parseDOM: (html:any) => new JSDOM(html)    });
    const innerHtml = html.window.document.documentElement.innerHTML
    //console.log("XXX4", innerHtml);
    //console.log("XXX4", html.window.document.innerHTML);
    const res = "data:text/html," + innerHtml
    //console.log("res", res)

    const blob2 = content.slice(0, content.size, "multipart/related")

    const reader = new window.FileReader();
    reader.readAsDataURL(blob2);
    reader.onloadend = function () {
      const win = window.open();
      if (win) {
        win.document.write(res + "<br>")
        win.document.write("<iframe style='width:100%;height:800px' src=" + res + "><\/iframe>");
      }
    }

    return Promise.resolve('done')
  }

  async getMHtmlInline(url: string): Promise<object> {
    console.log("getMHtmlInline", url, this.db)
    try {
      const mhtml = await this.db.get('mhtml', url)
      const mhtmlString = await mhtml.content.text()
      console.log("mhtmlString", mhtmlString)
      const html = mhtml2html.convert(mhtmlString)
      console.log("html", html)
      const innerHtml = html.window.document.documentElement.innerHTML
      return Promise.resolve({
        html: innerHtml,
        title: mhtml.title,
        created: mhtml.created
      })
    } catch (ex) {
      console.log("problem getting MHtmlInline", ex)
      return Promise.reject("problem getting MHtmlInline")
    }
  }

  getMHtmls(): Promise<MHtml[]> {
    if (!this.db) { // can happen for some reason
      return Promise.resolve([])
    }
    try {
      return this.db.getAll('mhtml')
    } catch (ex) {
      console.log("got error in getMHtmls", ex)
      return Promise.reject("got error in getMHtmls")
    }
  }


  async addSpace(space: Space): Promise<void> {
    return await this.db.put('spaces', space, space.id)
      .then(() => Promise.resolve())
  }

  deleteSpace(spaceId: string): Promise<void> {
    return this.db.delete('spaces', spaceId)
  }

  private async initDatabase(): Promise<IDBPDatabase> {
    console.debug("about to initialize indexedDB")
    return await openDB(INDEX_DB_NAME, INDEX_DB_VERSION, {
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
        if (!db.objectStoreNames.contains('stats')) {
          console.log("creating db stats")
          db.createObjectStore('stats');
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
        if (!db.objectStoreNames.contains('logs')) {
          console.log("creating db logs")
          db.createObjectStore('logs', {autoIncrement: true});
          //store.createIndex("expires", "expires", {unique: false});
        }
      },
    });
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


  saveStats(date: string, dataset: StatsEntry) {
    this.db.put('stats', dataset, date)
  }

  async getLogs(predicate: Predicate<LogEntry> = (l: LogEntry) => true): Promise<LogEntry[]> {
    if (this.db) {
      const transaction = this.db.transaction(["logs"]);
      const objectStore = transaction.objectStore("logs");
      const res: LogEntry[] = []
      let cursor = await objectStore.openCursor()
      while (cursor) {
        let key = cursor.primaryKey;
        let value = cursor.value;
        //console.log("***", key, value);
        const logEntry = new LogEntry(key as number, value.context, value.level, value.msg)
        if (predicate(logEntry)) {
          res.push(logEntry)
        }

        cursor = await cursor.continue();
      }
      return res
    }
    return Promise.reject('db not available (yet)')
  }

  async getStats(): Promise<StatsEntry[]> {
    if (this.db) {
      const store = this.db.transaction(["stats"]).objectStore("stats");
      const res: StatsEntry[] = []
      let cursor = await store.openCursor()
      while (cursor) {
        let key = cursor.primaryKey;
        let value = cursor.value;
        const logEntry = new StatsEntry(
          key as string,
          value.tabsets,
          value.openTabsCount,
          value.tabsCount,
          value.bookmarksCount,
          value.storageUsage)
        res.push(logEntry)
        cursor = await cursor.continue();
      }
      return res
    }
    return Promise.reject('db not available (yet)')
  }

  getNotifications(onlyNew: boolean = true): Promise<Notification[]> {
    return this.db.getAll('notifications')
  }

  addNotification(notification: Notification): Promise<void> {
    return this.db.add('notifications', notification, notification.id)
      .then((res) => Promise.resolve())
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

}

export default new IndexedDbPersistenceService()
