import PersistenceService from "src/services/PersistenceService";
import {IDBPDatabase} from "idb";
import {useUiStore} from "stores/uiStore";
import {Message} from "src/models/Message";
import {Space} from "src/models/Space";
import {Suggestion, SuggestionState} from "src/models/Suggestion";
import {SearchDoc} from "src/models/SearchDoc";
import {BlobType, SavedBlob} from "src/models/SavedBlob";
import {MHtml} from "src/models/MHtml";
import {Tab} from "src/models/Tab";
import {MetaLink} from "src/models/MetaLink";
import {Tabset} from "src/models/Tabset";
import {Window} from "src/models/Window";
import {RequestInfo} from "src/models/RequestInfo";
import {Notification, NotificationStatus} from "src/models/Notification";
// @ts-ignore
import LightningFS from '@isomorphic-git/lightning-fs';
import http from 'isomorphic-git/http/web'
import * as git from 'isomorphic-git'
import {Buffer} from "buffer";
import {useTabsStore} from "stores/tabsStore";
import {useSpacesStore} from "stores/spacesStore";
import {LocalStorage, uid} from "quasar";

if (typeof self !== 'undefined') {
  self.Buffer = Buffer;
}

async function createDir(...segments: string[]) {
  console.log("got segments", segments)
  let prefix = ''
  for (const segment of segments) {
    try {
      const path = `${dir}/${prefix}${segment}`
      console.log("creating fs path", path)
      prefix += segment + "/"
      await pfs.mkdir(path)
    } catch (err) {
      console.log("dir exists")
    }
  }
}

async function push(dir: string) {
  let pushResult = await git.push({
    fs,
    http,
    dir,
    remote: 'origin',
    corsProxy: 'https://cors.isomorphic-git.org',
    ref: 'main',
    onAuth: () => ({username: LocalStorage.getItem('sync.git.token') as string || '---'}),
  })
  console.log(pushResult)
}

class GitPersistenceService implements PersistenceService {
  private db: IDBPDatabase = null as unknown as IDBPDatabase
  private readonly _dir = "/tabsets";

  // TODO
  async init(dbName: string, url: string = 'https://github.com/evandor/tabsets-data.git') {
    console.log("=== initializing git database ===", dbName)
    this.db = await this.initDatabase(dbName, url)
    useUiStore().dbReady = true
  }


  private async initDatabase(dbName: string, url: string, dir: string = this._dir): Promise<any> {
    window.fs = new LightningFS('fs')
    console.log("hier!")
    window.pfs = window.fs.promises
    console.debug("about to initialize git")
    window.dir = dir
    console.log(dir);
    try {
      await pfs.mkdir(dir);
    } catch (err) {
      console.log("dir exists")
    }

    await pfs.readdir(dir);

    try {
      const cloneDef = {
        fs,
        http,
        dir,
        corsProxy: 'https://cors.isomorphic-git.org',
        url: url,
        ref: 'main',
        singleBranch: true,
        depth: 10,
        onAuth: () => ({username: LocalStorage.getItem('sync.git.token') as string || '---'}),
      }
      console.log(`about to clone '${url}' into ${dir}`, cloneDef)
      return await git.clone(cloneDef);
    } catch (err) {
      console.log("got error", err)
      return Promise.reject(err)
    }
  }

  async testConnection(gitRepoUrl: string): Promise<string> { //, gitRepoToken: string) {
    try {
      const dir = "/" + uid()
      try {
        const r = await this.initDatabase("testdb", gitRepoUrl, dir)
        console.log("got r", r)
      } catch (e: any) {
        console.log("got e", e)
        return Promise.resolve(e.toString())
      }
      await pfs.unlink(dir)
      console.log("success")
      return Promise.resolve("success")
    } catch (err) {
      return Promise.resolve("got error: " + err)
    }

  }


  /**
   * === Tabsets ========================================
   */

  async loadTabsets(): Promise<void> {
    console.log("=== loading tabsets ===")
    // update from git, then read from fs
    const tabsets: Tabset[] = []
    try {
      await createDir("tabsets")
      const result: string[] = await pfs.readdir(`${dir}/tabsets`)//, (callback: any) => {
      console.log("callback", result)
      for (var index in result) {
        console.log("got ts index", index)
        const tabsetId = result[index]
        const tsDataLocation = `${dir}/tabsets/${tabsetId}/tabset.json`
        console.log("`${dir}/tabsets/${tabsetId}/tabset.json`", `${dir}/tabsets/${tabsetId}/tabset.json`)
        try {
          const tsData = await pfs.readFile(tsDataLocation)
          console.log("tsData", tsData)
          const ts = JSON.parse(tsData) as Tabset
          ts.tabs = []

          try {
            await createDir("tabsets", tabsetId, "tabs")
            const tabsResult: string[] = await pfs.readdir(`${dir}/tabsets/${tabsetId}/tabs`)
            for (var tabsIndex in tabsResult) {
              const tab = JSON.parse(await pfs.readFile(`${dir}/tabsets/${tabsetId}/tabs/${tabsResult[tabsIndex]}`))
              ts.tabs.push(tab)
            }
          } catch (err) {
            console.warn("err", err)
          }

          tabsets.push(ts)
        } catch (err) {
          console.log("err", err)
        }
      }
    } catch (err) {
      console.warn("err", err)
    }
    for (const t of tabsets) {
      useTabsStore().addTabset(t)
    }

    return Promise.resolve(undefined);
  }

  async saveTabset(tabset: Tabset): Promise<any> {
    // assuming new
    const tabsetFilename = `tabsets/${tabset.id}`
    await createDir("tabsets", tabset.id, "tabs")

    let strippedTabset = JSON.parse(JSON.stringify(tabset));
    const tabs = strippedTabset.tabs as Tab[]
    delete strippedTabset['tabs']
    await pfs.writeFile(`${dir}/tabsets/${tabset.id}/tabset.json`,
      JSON.stringify(strippedTabset, null, 2), 'utf8')
    //await git.status({fs, dir, filepath: 'newfile.txt'})
    await git.add({fs, dir, filepath: tabsetFilename})

    // add / update tabs
    for (const t of tabs) {
      await pfs.writeFile(`${dir}/tabsets/${tabset.id}/tabs/${t.id}`, JSON.stringify(t, null, 2), 'utf8')
      //await git.status({fs, dir, filepath: 'newfile.txt'})
      await git.add({fs, dir, filepath: tabsetFilename + "/tabs"})
    }

    let sha = await git.commit({
      fs,
      dir,
      message: 'yeah.',
      author: {
        name: 'Mr. Test',
        email: 'mrtest@example.com'
      }
    })

    console.log(sha)
    await push(this._dir);
    return Promise.resolve(undefined);
  }

  async deleteTabset(tabsetId: string): Promise<any> {
    await pfs.rmdir(`${dir}/tabsets/${tabset.id}`)
    await push(this._dir);
    return Promise.resolve(undefined);
  }

  /**
   * === Spaces ========================================
   */

  async loadSpaces(): Promise<any> {
    console.log("=== loading spaces ===")
    // update from git, then read from fs
    const spaces: Space[] = []
    try {
      const entityName = "space"
      const entitiesName = "spaces"
      await createDir(entitiesName)
      const result: string[] = await pfs.readdir(`${dir}/${entitiesName}`)//, (callback: any) => {
      console.log("callback", result)
      for (var index in result) {
        console.log("got index", index)
        const entityId = result[index]
        const tsDataLocation = `${dir}/${entitiesName}/${entityId}/tabset.json`
        //console.log("`${dir}/tabsets/${tabsetId}/tabset.json`", `${dir}/tabsets/${tabsetId}/${entityName}.json`)
        try {
          const tsData = await pfs.readFile(tsDataLocation)
          console.log("tsData", tsData)
          const s = JSON.parse(tsData) as Space
          //ts.tabs = []

          // try {
          //   await createDir(entitiesName, tabsetId, "tabs")
          //   const tabsResult: string[] = await pfs.readdir(`${dir}/tabsets/${tabsetId}/tabs`)
          //   for (var tabsIndex in tabsResult) {
          //     const tab = JSON.parse(await pfs.readFile(`${dir}/tabsets/${tabsetId}/tabs/${tabsResult[tabsIndex]}`))
          //     ts.tabs.push(tab)
          //   }
          // } catch (err) {
          //   console.warn("err", err)
          // }

          spaces.push(s)
        } catch (err) {
          console.log("err", err)
        }
      }
    } catch (err) {
      console.warn("err", err)
    }
    for (const s of spaces) {
      useSpacesStore().addSpace(s)
    }

    return Promise.resolve(undefined);

  }

  async addSpace(entity: Space): Promise<any> {
    const entityName = "space"
    const entitiesName = "spaces"

    // assuming new
    const tabsetFilename = `${entitiesName}/${entity.id}`
    //await createDir(entitiesName, entity.id, "tabs")

    let strippedTabset = JSON.parse(JSON.stringify(entity));
    //const tabs = strippedTabset.tabs as Tab[]
    //delete strippedTabset['tabs']
    await createDir(entitiesName, entity.id)
    await pfs.writeFile(`${dir}/${entitiesName}/${entity.id}/${entityName}.json`,
      JSON.stringify(strippedTabset, null, 2), 'utf8')
    //await git.status({fs, dir, filepath: 'newfile.txt'})
    await git.add({fs, dir, filepath: tabsetFilename})

    let sha = await git.commit({
      fs,
      dir,
      message: 'spaces.',
      author: {
        name: 'Mr. Test',
        email: 'mrtest@example.com'
      }
    })

    console.log(sha)
    await push(this._dir);
    return Promise.resolve(undefined);
  }

  async deleteSpace(entityId: string) {
    await pfs.rmdir(`${dir}/spaces/${entityId}`)
    await push(this._dir);
    return Promise.resolve(undefined);
  }

  /**
   * === ... ========================================
   */



  addGroup(group: chrome.tabGroups.TabGroup): Promise<any> {
    return Promise.reject(undefined);
  }

  addMessage(msg: Message): void {
  }

  addNotification(notification: Notification): Promise<any> {
    return Promise.reject(undefined);
  }

  addSuggestion(suggestion: Suggestion): Promise<any> {
    return Promise.reject(undefined);
  }

  addWindow(window: Window): Promise<any> {
    return Promise.reject(undefined);
  }

  cleanUpContent(): Promise<SearchDoc[]> {
    return Promise.reject([]);
  }

  cleanUpRequests(): Promise<void> {
    return Promise.reject(undefined);
  }

  cleanUpTabsets(): Promise<void> {
    return Promise.reject(undefined);
  }

  cleanUpThumbnails(): Promise<void> {
    return Promise.reject(undefined);
  }

  clear(name: string): any {
  }

  compactDb(): Promise<any> {
    return Promise.reject(undefined);
  }

  deleteBlob(tabId: string, elementId: string): void {
  }

  deleteContent(url: string): Promise<void> {
    return Promise.reject(undefined);
  }

  deleteGroupByTitle(title: string): Promise<void> {
    return Promise.reject(undefined);
  }

  deleteMHtml(id: string): Promise<void> {
    return Promise.reject(undefined);
  }

  deleteThumbnail(url: string): Promise<void> {
    return Promise.reject(undefined);
  }

  getActiveFeatures(): Promise<string[]> {
    return Promise.reject([]);
  }

  getBlobs(type: BlobType): Promise<any[]> {
    return Promise.reject([]);
  }

  getBlobsForTab(tabId: string): Promise<SavedBlob[]> {
    return Promise.reject([]);
  }

  getContent(url: string): Promise<object> {
    return Promise.reject({});
  }

  getContents(): Promise<any[]> {
    return Promise.reject([]);
  }

  getGroups(): Promise<chrome.tabGroups.TabGroup[]> {
    return Promise.reject([]);
  }

  getLinks(url: string): Promise<object> {
    return Promise.reject({});
  }

  getMHtml(url: string): Promise<object> {
    return Promise.reject({});
  }

  getMHtmlInline(url: string): Promise<object> {
    return Promise.reject({});
  }

  getMHtmls(): Promise<MHtml[]> {
    return Promise.reject([]);
  }

  getMessages(): Promise<Message[]> {
    return Promise.reject([]);
  }

  getMetaLinks(url: string): Promise<object> {
    return Promise.reject({});
  }

  getNotifications(onlyNew: boolean): Promise<Notification[]> {
    return Promise.reject([]);
  }

  getRequest(url: string): Promise<string> {
    return Promise.reject("");
  }

  getSuggestions(): Promise<Suggestion[]> {
    return Promise.reject([]);
  }

  getThumbnail(url: string): Promise<string> {
    return Promise.reject("");
  }

  getWindow(windowId: number): Promise<Window | undefined> {
    return Promise.reject(undefined);
  }

  getWindows(): Promise<Window[]> {
    return Promise.reject([]);
  }

  loadCategories(): Promise<any> {
    return Promise.reject(undefined);
  }


  notificationRead(notificationId: string): Promise<void> {
    return Promise.reject(undefined);
  }

  reloadTabset(tabsetId: string): void {
  }

  removeSuggestion(id: string): any {
  }

  removeWindow(windowId: number): Promise<void> {
    return Promise.reject(undefined);
  }

  saveActiveFeatures(val: string[]): any {
  }

  saveBlob(id: string, url: string, data: Blob, type: BlobType, remark: string | undefined): Promise<any> {
    return Promise.reject(undefined);
  }

  saveContent(tab: Tab, text: string, metas: object, title: string, tabsetIds: string[]): Promise<any> {
    return Promise.reject(undefined);
  }

  saveLinks(url: string, links: any): Promise<void> {
    return Promise.reject(undefined);
  }

  saveMHtml(tab: Tab, mhtml: Blob): Promise<string> {
    return Promise.reject("");
  }

  saveMetaLinks(url: string, metaLinks: MetaLink[]): Promise<void> {
    return Promise.reject(undefined);
  }

  saveRequest(url: string, requestInfo: RequestInfo): Promise<void> {
    return Promise.reject(undefined);
  }

  saveThumbnail(tab: chrome.tabs.Tab, thumbnail: string): Promise<void> {
    return Promise.reject(undefined);
  }

  setSuggestionState(id: string, state: SuggestionState): any {
  }

  updateContent(url: string): Promise<object> {
    return Promise.reject({});
  }

  updateGroup(group: chrome.tabGroups.TabGroup): Promise<any> {
    return Promise.reject(undefined);
  }

  updateThumbnail(url: string): Promise<void> {
    return Promise.reject(undefined);
  }

  updateWindow(window: Window): Promise<void> {
    return Promise.reject(undefined);
  }

  upsertWindow(window: Window, windowName: string, screenLabel: string | undefined): Promise<void> {
    return Promise.reject(undefined);
  }

}

export default new GitPersistenceService()
