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

  saveThumbnail(url: string, thumbnail: string): Promise<void> {
    const encodedTabUrl = btoa(url)
    return this.db.put('thumbnails', {
      expires: new Date().getTime() + 1000 * 60 * EXPIRE_DATA_PERIOD_IN_MINUTES,
      thumbnail: thumbnail
    }, encodedTabUrl)
      .then(() => console.log("added thumbnail"))
      .catch(err => console.log("err", err))
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
    }
    return Promise.reject("tab.url missing")
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

  async cleanUpRequests(): Promise<void> {
    const objectStore = this.db.transaction("requests", "readwrite").objectStore("requests");
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

    var reader = new window.FileReader();
    reader.readAsDataURL(blob2);
    reader.onloadend = function () {
      let base64data = reader.result as unknown as string
      //console.log(base64data);

      //base64data = base64data?.replace("data:application/octet-stream;base64,", "data:multipart/related;base64,")
      var win = window.open();
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
          let store = db.createObjectStore('spaces');
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


  saveStats(dataset: object) {
    const offset = new Date().getTimezoneOffset()
    const todayLong = new Date(new Date().getTime() - (offset * 60 * 1000))
    const today = todayLong.toISOString().split('T')[0]
    this.db.put('stats', dataset, today)
  }
}

export default new IndexedDbPersistenceService()
