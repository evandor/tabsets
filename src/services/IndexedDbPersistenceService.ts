import {IDBPDatabase, openDB} from "idb";
import {useTabsStore} from "src/stores/tabsStore";
import _ from "lodash";
import {INDEX_DB_VERSION, EXPIRE_DATA_PERIOD_IN_MINUTES} from "boot/constants";
import PersistenceService from "src/services/PersistenceService";
import {Tabset, TabsetStatus} from "src/models/Tabset";
import mhtml2html from 'mhtml2html';
import {useSpacesStore} from "src/stores/spacesStore";
import {Space} from "src/models/Space";
import {MHtml} from "src/models/MHtml";
import {Tab} from "src/models/Tab";
import {SearchDoc} from "src/models/SearchDoc";
import {MetaLink} from "src/models/MetaLink";
import {StatsEntry} from "src/models/StatsEntry";
import {uid} from "quasar";
import {Notification, NotificationStatus} from "src/models/Notification";
import {StaticSuggestionIdent, Suggestion, SuggestionState} from "src/models/Suggestion";
import {useUiStore} from "src/stores/uiStore";
import {useCategoriesStore} from "stores/categoriesStore";
import {cloudFunctionsApi} from "src/api/cloudfunctionsApi";
import {Category} from "src/models/Category";

class IndexedDbPersistenceService implements PersistenceService {
  private db: IDBPDatabase = null as unknown as IDBPDatabase

  async init(dbName: string) {
    console.log("initializing indexeddb database", dbName)
    this.db = await this.initDatabase(dbName)
    useUiStore().dbReady = true
  }

  async loadTabsets(): Promise<any> {
    const tabsStore = useTabsStore()
    const keys: IDBValidKey[] = await this.db.getAllKeys('tabsets')
    const res: Promise<any>[] = _.map(keys, key => {
      return this.db.get('tabsets', key)
        .then(ts => {
          if (!ts.status) {
            ts.status = TabsetStatus.DEFAULT
          }
          // migration from tabsets.tabs to tabs
          // TODO check can be removed in the future when we had a couple of releases
          return this.db.get('tabs', ts.id)
            .then((tabs: Tab[]) => {
              //console.log("got tabs for ", ts.id, tabs, ts.tabs)
              if (!tabs) {
                console.log("migrating...", JSON.stringify(ts.tabs))
                this.saveTabset(ts)
              }
              tabsStore.addTabset(ts)
              return ts
            })
        })
        .catch(err => console.log("err", err))
    })

    return await Promise.all(res)
  }

  async loadSpaces(): Promise<void> {
    console.debug("loading spaces...")
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

  async loadCategories(): Promise<void> {
    console.debug("loading categories...")
    const categoriesStore = useCategoriesStore()
    const cs: Category[] = await cloudFunctionsApi().getCategories()
    _.forEach(cs, c => {
      categoriesStore.putCategory(c)
      // this.db.get('spaces', key)
      //   .then((space: Space) => {
      //     spacesStore.putSpace(space)
      //   })
      //   .catch(err => console.log("err", err))
    })
  }


  async saveTabset(tabset: Tabset): Promise<IDBValidKey> {
    // console.log("saving tabset1", tabset)
    // console.log("saving tabset2", tabset.tabs)
    // console.log("saving tabset3", JSON.stringify(tabset.tabs))
    try {
      const tabsRes = await this.db.put('tabs', JSON.parse(JSON.stringify(tabset.tabs)), tabset.id);
      const tabsetClone = Object.assign({}, tabset);
      tabsetClone.tabs = []
      tabsetClone.tabsCount = tabset.tabs.length
      await this.db.put('tabsets', JSON.parse(JSON.stringify(tabsetClone)), tabset.id);
      return tabsRes
    } catch (err) {
      return Promise.reject("got error: " + err)
    }
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

  // saveLog(context: string, level: LogLevel, msg: string, ...args: any[]): Promise<any> {
  //   if (this.db) {
  //     const store = this.db.transaction(["logs"], "readwrite")
  //       .objectStore("logs");
  //     return store.put({
  //       timestamp: new Date().getTime(),
  //       context,
  //       msg,
  //       level,
  //       args
  //     })
  //   }
  //   return Promise.reject("db not available (yet)")
  // }

  saveThumbnail(tab: chrome.tabs.Tab, thumbnail: string): Promise<void> {
    if (tab.url) {
      const encodedTabUrl = btoa(tab.url)
      return this.db.put('thumbnails', {
        expires: new Date().getTime() + 1000 * 60 * EXPIRE_DATA_PERIOD_IN_MINUTES,
        thumbnail: thumbnail
      }, encodedTabUrl)
        .then(() => console.log(new Tab(uid(), tab), `saved thumbnail for url ${tab.url}, ${Math.round(thumbnail.length / 1024)}kB`))
        .catch(err => console.error(new Tab(uid(), tab), err))
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
    if (this.db) {
      return this.db.get('content', encodedUrl)
    }
    return Promise.reject("db not ready (yet)")
  }

  deleteThumbnail(url: string): Promise<void> {
    return this.db.delete('thumbnails', btoa(url))
  }

  deleteContent(url: string): Promise<void> {
    return this.db.delete('content', btoa(url))
  }

  saveContent(tab: chrome.tabs.Tab, text: string, metas: object, title: string, tabsetIds: string[],
              tabsetCandidates: object[] = []): Promise<IDBValidKey> {
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
        favIconUrl: tab.favIconUrl,
        tabsetCandidates: tabsetCandidates
      }, encodedTabUrl)
        .then((res) => {
          // console.info(new Tab(uid(), tab), "saved content for url " + tab.url)
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

  async saveMHtml(tab: Tab, mhtml: Blob): Promise<string> {
    if (tab.chromeTab.url) {
      // console.log("TextDecoder('utf-8')", new TextDecoder('utf-8'), typeof mhtml)
      // console.log("mhtml", mhtml)

      //const mhtmlAsString = await mhtml.text()
      const mhtmlId = uid()
      this.db.put('mhtml', {
        id: mhtmlId,
        title: tab.name ? tab.name : tab.chromeTab.title,
        favIconUrl: tab.chromeTab.favIconUrl,
        url: tab.chromeTab.url,
        created: new Date().getTime(),
        content: mhtml
        //hash: uuidv5(mhtmlAsString, 'da42d8e8-2afd-446f-b72e-8b437aa03e46')
      }, mhtmlId)
      return Promise.resolve(mhtmlId)
    }
    return Promise.reject("tab.url missing")
  }

  saveBlob(id: string, url: string, data: Blob, type: string): Promise<any> {
    //const encodedTabUrl = btoa(tab.chromeTab.url)
    return this.db.put('blobs', {
      id: id,
      type: type,
      //title: tab.name ? tab.name : tab.chromeTab.title,
      //favIconUrl: tab.chromeTab.favIconUrl,
      url: url,
      created: new Date().getTime(),
      content: data
    }, id)
  }

  async getMHtml(id: string): Promise<any> {
    console.log("getting mhtml for", id)
    return this.db.get('mhtml', id)
  }

  async deleteMHtml(id: string): Promise<void> {
    return this.db.delete('mhtml', id)
  }

  async getMHtmlContent(url: string): Promise<any> {

    console.log("getting mhtml for", url)
    const mhtml = await this.db.get('mhtml', url)
    //  console.log("got", mhtml.content, typeof mhtml.content)

    const content: Blob = mhtml.content

    const mhtmlString = await content.text()
    const html = mhtml2html.convert(mhtmlString)//,{ parseDOM: (html:any) => new JSDOM(html)    });
    const innerHtml = html.window.document.documentElement.innerHTML
    const res = "data:text/html," + innerHtml

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
      const html = mhtml2html.convert(mhtmlString)
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

  getBlobs(type: string): Promise<any[]> {
    if (!this.db) { // can happen for some reason
      return Promise.resolve([])
    }
    try {
      return this.db.getAll('blobs')
        .then((b: any[]) => {
          return _.filter(b, d => d.type === type)
        })
    } catch (ex) {
      console.log("got error in getBlobs", ex)
      return Promise.reject("got error in getBlobs")
    }
  }

  getBlob(blobId: string): Promise<any> {
    if (!this.db) { // can happen for some reason
      return Promise.resolve([])
    }
    try {
      return this.db.getAll('blobs')
        .then((b: any[]) => {
          const found = _.filter(b, d => d.id === blobId)
          if (found && found.length === 1) {
            return Promise.resolve(found[0])
          }
          return Promise.reject("could not find blob for id " + blobId)
        })
    } catch (ex) {
      console.log("got error in getBlobs", ex)
      return Promise.reject("got error in getBlobs")
    }
  }

  async addSpace(space: Space): Promise<void> {
    return await this.db.put('spaces', space, space.id)
      .then(() => Promise.resolve())
  }

  deleteSpace(spaceId: string): Promise<void> {
    return this.db.delete('spaces', spaceId)
  }

  private async initDatabase(dbName: string): Promise<IDBPDatabase> {
    console.debug("about to initialize indexedDB")
    return await openDB(dbName, INDEX_DB_VERSION, {
      // upgrading see https://stackoverflow.com/questions/50193906/create-index-on-already-existing-objectstore
      upgrade(db) {
        if (!db.objectStoreNames.contains('tabsets')) {
          console.log("creating db tabsets")
          db.createObjectStore('tabsets');
        }
        if (!db.objectStoreNames.contains('tabs')) {
          console.log("creating db tabs")
          db.createObjectStore('tabs');
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

  getSuggestions(): Promise<Suggestion[]> {
    return this.db ? this.db.getAll('suggestions') : Promise.resolve([])
  }

  addSuggestion(suggestion: Suggestion): Promise<void> {
    return this.getSuggestions()
      .then((suggestions) => {
        const found = _.find(suggestions, (s: Suggestion) => s.url === suggestion.url)
        if (!found) {
          return this.db.add('suggestions', suggestion, suggestion.id)
            .then((res) => Promise.resolve())
        }
        console.log("suggestion already exists")
        return Promise.resolve()
      })
    // .catch((err) => Promise.reject(err))
  }

  removeSuggestion(ident: StaticSuggestionIdent): Promise<any> {
    return this.db.delete('suggestions', ident)
  }


  setSuggestionState(suggestionId: string, state: SuggestionState): Promise<Suggestion> {
    console.log("setting suggestion to state", suggestionId, state)
    const objectStore = this.db.transaction('suggestions', 'readwrite').objectStore('suggestions');
    return objectStore.get(suggestionId)
      .then((res: Suggestion) => {
        res.state = state
        objectStore.put(res, suggestionId)
        return res
      })
      .catch((err) => Promise.reject("error updating suggestion" + err))
  }

  compactDb(): Promise<any> {
    return Promise.resolve(undefined);
  }

  // ignoreSuggestion(suggestionId: string): Promise<void> {
  //   console.log("ignoring suggestion", suggestionId)
  //   const objectStore = this.db.transaction('suggestions', 'readwrite').objectStore('suggestions');
  //   return objectStore.get(suggestionId)
  //     .then((res: Suggestion) => {
  //       res.state = SuggestionState.IGNORED
  //       objectStore.put(res, suggestionId)
  //     })
  // }

  // applySuggestion(suggestionId: string): Promise<Suggestion> {
  //   console.log("applying suggestion", suggestionId)
  //   const objectStore = this.db.transaction('suggestions', 'readwrite').objectStore('suggestions');
  //   return objectStore.get(suggestionId)
  //     .then((res: Suggestion) => {
  //       res.state = SuggestionState.APPLIED
  //       objectStore.put(res, suggestionId)
  //       return res
  //     })
  //     .catch((err) => Promise.reject("error applying suggestion" + err))
  // }
  async loadTabs(tabsetId: string): Promise<Tab[]> {
    return await this.db.get("tabs", tabsetId)
  }

  clear(name: string) {
    this.db.clear(name).catch((e) => console.warn(e))
  }
}

export default new IndexedDbPersistenceService()
