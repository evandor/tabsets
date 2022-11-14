import {IDBPDatabase, openDB} from "idb";
import {useTabsStore} from "src/stores/tabsStore";
import _ from "lodash";
import {INDEX_DB_NAME} from "boot/constants";
import PersistenceService from "src/services/PersistenceService";
import {Tabset} from "src/models/Tabset";
import mhtml2html from 'mhtml2html';
import {uid} from "quasar";
import {useSpacesStore} from "stores/spacesStore";
import {Space} from "src/models/Space";

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

  async updateContent(url: string):Promise<object> {
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

  saveMhtml(tab: chrome.tabs.Tab, mhtml: string): Promise<IDBValidKey> {
    if (tab.url) {
      const encodedTabUrl = btoa(tab.url)
      return this.db.put('mhtml', {
        id: encodedTabUrl,
        url: tab.url,
        content: mhtml
      }, encodedTabUrl)
    }
    return Promise.reject("tab.url missing")
  }

  base64ToArrayBuffer(_base64Str: string) {
    var binaryString = window.atob(_base64Str);
    var binaryLen = binaryString.length;
    var bytes = new Uint8Array(binaryLen);
    for (var i = 0; i < binaryLen; i++) {
      var ascii = binaryString.charCodeAt(i);
      bytes[i] = ascii;
    }
    return bytes;
  }

  async getMhtml(url: string): Promise<any> {

    const mhtml =  await this.db.get('mhtml', url)
    console.log("got", mhtml.content, typeof mhtml.content)

    const content:Blob = mhtml.content

    const mhtmlString = await content.text()
    console.log("mhtmlString", mhtmlString)
    const html = mhtml2html.convert(mhtmlString)//,{ parseDOM: (html:any) => new JSDOM(html)    });
    console.log("XXX1", html, typeof html);
    console.log("XXX2", html.window);
    console.log("XXX3", html.window.document);
    const innerHtml = html.window.document.documentElement.innerHTML
    console.log("XXX4", innerHtml);
   //console.log("XXX4", html.window.document.innerHTML);
    const res = "data:text/html," + innerHtml
    console.log("res", res)

    const blob2 = content.slice(0, content.size, "multipart/related")



    let blob = new Blob([mhtml.content])
    let img = "iVBORw0KGgoAAAANSUhEUgAAABgAAAAYCAYAAADgdz34AAAABHNCSVQICAgIfAhkiAAAAAlwSFlzAAAApgAAAKYB3X3/OAAAABl0RVh0U29mdHdhcmUAd3d3Lmlua3NjYXBlLm9yZ5vuPBoAAANCSURBVEiJtZZPbBtFFMZ/M7ubXdtdb1xSFyeilBapySVU8h8OoFaooFSqiihIVIpQBKci6KEg9Q6H9kovIHoCIVQJJCKE1ENFjnAgcaSGC6rEnxBwA04Tx43t2FnvDAfjkNibxgHxnWb2e/u992bee7tCa00YFsffekFY+nUzFtjW0LrvjRXrCDIAaPLlW0nHL0SsZtVoaF98mLrx3pdhOqLtYPHChahZcYYO7KvPFxvRl5XPp1sN3adWiD1ZAqD6XYK1b/dvE5IWryTt2udLFedwc1+9kLp+vbbpoDh+6TklxBeAi9TL0taeWpdmZzQDry0AcO+jQ12RyohqqoYoo8RDwJrU+qXkjWtfi8Xxt58BdQuwQs9qC/afLwCw8tnQbqYAPsgxE1S6F3EAIXux2oQFKm0ihMsOF71dHYx+f3NND68ghCu1YIoePPQN1pGRABkJ6Bus96CutRZMydTl+TvuiRW1m3n0eDl0vRPcEysqdXn+jsQPsrHMquGeXEaY4Yk4wxWcY5V/9scqOMOVUFthatyTy8QyqwZ+kDURKoMWxNKr2EeqVKcTNOajqKoBgOE28U4tdQl5p5bwCw7BWquaZSzAPlwjlithJtp3pTImSqQRrb2Z8PHGigD4RZuNX6JYj6wj7O4TFLbCO/Mn/m8R+h6rYSUb3ekokRY6f/YukArN979jcW+V/S8g0eT/N3VN3kTqWbQ428m9/8k0P/1aIhF36PccEl6EhOcAUCrXKZXXWS3XKd2vc/TRBG9O5ELC17MmWubD2nKhUKZa26Ba2+D3P+4/MNCFwg59oWVeYhkzgN/JDR8deKBoD7Y+ljEjGZ0sosXVTvbc6RHirr2reNy1OXd6pJsQ+gqjk8VWFYmHrwBzW/n+uMPFiRwHB2I7ih8ciHFxIkd/3Omk5tCDV1t+2nNu5sxxpDFNx+huNhVT3/zMDz8usXC3ddaHBj1GHj/As08fwTS7Kt1HBTmyN29vdwAw+/wbwLVOJ3uAD1wi/dUH7Qei66PfyuRj4Ik9is+hglfbkbfR3cnZm7chlUWLdwmprtCohX4HUtlOcQjLYCu+fzGJH2QRKvP3UNz8bWk1qMxjGTOMThZ3kvgLI5AzFfo379UAAAAASUVORK5CYII="
    const src ="data:image/png;base64," +  img// +  mhtml.content

    let base64data

    var audioURL = window.URL.createObjectURL(new Blob([mhtml.content]));
    //audio.src = audioURL;

    //var blob2 = new Blob([src], { type: 'multipart/related' });
   // window.open(URL.createObjectURL(blob2), "_blank");



    var reader = new window.FileReader();
    reader.readAsDataURL(blob2);
    reader.onloadend = function () {
      let base64data = reader.result as unknown as string
      console.log(base64data);



      base64data = base64data?.replace("data:application/octet-stream;base64,", "data:multipart/related;base64,")
      var win = window.open();
      if (win) {
        win.document.write(res + "<br>")
        win.document.write("<iframe style='width:100%;height:800px' src=" + res+ "><\/iframe>");
      }
    }
    //const src ="data:multipart/related;base64," + base64data



    // let blob = new Blob([mhtml.content])
    // blob = blob.slice(0, blob.size, "multipart/related")
    //
    //  const file = window.URL.createObjectURL(new Blob([src]))
    // console.log("file", file)
    // const docUrl = document.createElement('a');
    // docUrl.href = file;
    // //docUrl.setAttribute('download', 'filename.mhtml');
    // console.log("docUrl", docUrl)
    // document.body.appendChild(docUrl);
    // docUrl.click();

    return Promise.resolve('done')
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
