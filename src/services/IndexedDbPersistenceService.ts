import {IDBPDatabase, openDB} from "idb";
import {useTabsStore} from "src/stores/tabsStore";
import _ from "lodash";
import {INDEX_DB_NAME} from "boot/constants";
import PersistenceService from "src/services/PersistenceService";
import {Tabset} from "src/models/Tabset";
import mhtml2html from 'mhtml2html';
import {useSpacesStore} from "stores/spacesStore";
import {Space} from "src/models/Space";
import {MHtml} from "src/models/MHtml";
import {Tab} from "src/models/Tab";

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
            tabsStore.ignoredTabset = ts
          } else {
            tabsStore.addTabset(ts)
          }
        })
        .catch(err => console.log("err", err))
    })
  }

  async loadSpaces(): Promise<void> {
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
      expires: new Date().getTime() + 1000 * 60 * 60,
      thumbnail: thumbnail
    }, encodedTabUrl)
      .then(() => console.log("added thumbnail"))
      .catch(err => console.log("err", err))
  }

  getThumbnail(url: string): Promise<string> {
    const encodedUrl = btoa(url)
    return this.db.get('thumbnails', encodedUrl)
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

  saveContent(tab: chrome.tabs.Tab, text: string, metas: object, title: string, description: string, tabsetIds: string[]): Promise<IDBValidKey> {
    if (tab.url) {
      const encodedTabUrl = btoa(tab.url)
      return this.db.put('content', {
        id: encodedTabUrl,
        expires: new Date().getTime() + 1000 * 60 * 60,
        title,
        description,
        url: tab.url,
        content: text,
        metas: metas,
        tabsets: tabsetIds,
        favIconUrl: tab.favIconUrl
      }, encodedTabUrl)
    }
    return Promise.reject("tab.url missing")
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

  async cleanUpContent(): Promise<void> {
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
              description: data.description,
              metas: data.metas,
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

    const mhtml = await this.db.get('mhtml', url)
    console.log("got", mhtml.content, typeof mhtml.content)

    const content: Blob = mhtml.content

    const mhtmlString = await content.text()
    //console.log("mhtmlString", mhtmlString)
    const html = mhtml2html.convert(mhtmlString)//,{ parseDOM: (html:any) => new JSDOM(html)    });
    console.log("XXX1", html, typeof html);
    console.log("XXX2", html.window);
    console.log("XXX3", html.window.document);
    const innerHtml = html.window.document.documentElement.innerHTML
    //console.log("XXX4", innerHtml);
    //console.log("XXX4", html.window.document.innerHTML);
    const res = "data:text/html," + innerHtml
    console.log("res", res)

    const blob2 = content.slice(0, content.size, "multipart/related")

    var reader = new window.FileReader();
    reader.readAsDataURL(blob2);
    reader.onloadend = function () {
      let base64data = reader.result as unknown as string
      //console.log(base64data);

      base64data = base64data?.replace("data:application/octet-stream;base64,", "data:multipart/related;base64,")
      var win = window.open();
      if (win) {
        win.document.write(res + "<br>")
        win.document.write("<iframe style='width:100%;height:800px' src=" + res + "><\/iframe>");
      }
    }

    return Promise.resolve('done')
  }

  async getMHtmlInline(url: string): Promise<object> {
    const mhtml = await this.db.get('mhtml', url)
    const mhtmlString = await mhtml.content.text()
    const html = mhtml2html.convert(mhtmlString)
    const innerHtml = html.window.document.documentElement.innerHTML
    return Promise.resolve({
      html: innerHtml,
      title: mhtml.title,
      created: mhtml.created
    })
  }

  getMHtmls(): Promise<MHtml[]>  {
    console.log("getMHtmls")
    return this.db.getAll('mhtml')
  }


  async addSpace(space: Space): Promise<void> {
    return await this.db.put('spaces', space, space.id)
      .then(() => Promise.resolve())
  }

  private async initDatabase(): Promise<IDBPDatabase> {
    return await openDB(INDEX_DB_NAME, 3, {
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
          let store = db.createObjectStore('mhtml');
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


}

export default new IndexedDbPersistenceService()
