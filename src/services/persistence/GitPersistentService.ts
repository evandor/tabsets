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

self.Buffer = Buffer;

async function createDir(...segments: string[]) {
  console.log("got segmetns", segments)
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

class GitPersistenceService implements PersistenceService {
  private db: IDBPDatabase = null as unknown as IDBPDatabase

  async init(dbName: string) {
    console.log("=== initializing git database ===", dbName)
    this.db = await this.initDatabase(dbName)
    useUiStore().dbReady = true
  }

  private async initDatabase(dbName: string): Promise<any> {
    window.fs = new LightningFS('fs')
    console.log("hier!")
    window.pfs = window.fs.promises
    console.debug("about to initialize git")
    window.dir = '/tutorial'
    console.log(dir);
    try {
      await pfs.mkdir(dir);
    } catch (err) {
      console.log("dir exists")
    }

    await pfs.readdir(dir);

    await git.clone({
      fs,
      http,
      dir,
      corsProxy: 'https://cors.isomorphic-git.org',
      url: 'https://github.com/evandor/tabsets-data.git',
      ref: 'main',
      singleBranch: true,
      depth: 10
    });

    await pfs.readdir(dir);

    const log = await git.log({fs, dir})
    console.log("git log", log)

    const status = await git.status({fs, dir, filepath: 'README.md'})
    console.log("status", status)
  }

  addGroup(group: chrome.tabGroups.TabGroup): Promise<any> {
    return Promise.resolve(undefined);
  }

  addMessage(msg: Message): void {
  }

  addNotification(notification: Notification): Promise<any> {
    return Promise.resolve(undefined);
  }

  addSpace(space: Space): Promise<any> {
    return Promise.resolve(undefined);
  }

  addSuggestion(suggestion: Suggestion): Promise<any> {
    return Promise.resolve(undefined);
  }

  addWindow(window: Window): Promise<any> {
    return Promise.resolve(undefined);
  }

  cleanUpContent(): Promise<SearchDoc[]> {
    return Promise.resolve([]);
  }

  cleanUpRequests(): Promise<void> {
    return Promise.resolve(undefined);
  }

  cleanUpTabsets(): Promise<void> {
    return Promise.resolve(undefined);
  }

  cleanUpThumbnails(): Promise<void> {
    return Promise.resolve(undefined);
  }

  clear(name: string): any {
  }

  compactDb(): Promise<any> {
    return Promise.resolve(undefined);
  }

  deleteBlob(tabId: string, elementId: string): void {
  }

  deleteContent(url: string): Promise<void> {
    return Promise.resolve(undefined);
  }

  deleteGroupByTitle(title: string): Promise<void> {
    return Promise.resolve(undefined);
  }

  deleteMHtml(id: string): Promise<void> {
    return Promise.resolve(undefined);
  }

  deleteSpace(spaceId: string): void {
  }

  deleteTabset(tabsetId: string): Promise<any> {
    return Promise.resolve(undefined);
  }

  deleteThumbnail(url: string): Promise<void> {
    return Promise.resolve(undefined);
  }

  getActiveFeatures(): Promise<string[]> {
    return Promise.resolve([]);
  }

  getBlobs(type: BlobType): Promise<any[]> {
    return Promise.resolve([]);
  }

  getBlobsForTab(tabId: string): Promise<SavedBlob[]> {
    return Promise.resolve([]);
  }

  getContent(url: string): Promise<object> {
    return Promise.resolve({});
  }

  getContents(): Promise<any[]> {
    return Promise.resolve([]);
  }

  getGroups(): Promise<chrome.tabGroups.TabGroup[]> {
    return Promise.resolve([]);
  }

  getLinks(url: string): Promise<object> {
    return Promise.resolve({});
  }

  getMHtml(url: string): Promise<object> {
    return Promise.resolve({});
  }

  getMHtmlInline(url: string): Promise<object> {
    return Promise.resolve({});
  }

  getMHtmls(): Promise<MHtml[]> {
    return Promise.resolve([]);
  }

  getMessages(): Promise<Message[]> {
    return Promise.resolve([]);
  }

  getMetaLinks(url: string): Promise<object> {
    return Promise.resolve({});
  }

  getNotifications(onlyNew: boolean): Promise<Notification[]> {
    return Promise.resolve([]);
  }

  getRequest(url: string): Promise<string> {
    return Promise.resolve("");
  }

  getSuggestions(): Promise<Suggestion[]> {
    return Promise.resolve([]);
  }

  getThumbnail(url: string): Promise<string> {
    return Promise.resolve("");
  }

  getWindow(windowId: number): Promise<Window | undefined> {
    return Promise.resolve(undefined);
  }

  getWindows(): Promise<Window[]> {
    return Promise.resolve([]);
  }

  loadCategories(): Promise<any> {
    return Promise.resolve(undefined);
  }

  loadSpaces(): Promise<any> {
    return Promise.resolve(undefined);
  }

  async loadTabsets(): Promise<void> {
    console.log("=== loading tabsets ===")
    // update from git, then read from fs
    const tabsets: Tabset[] = []
    try {
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
            const tabsResult: string[] = await pfs.readdir(`${dir}/tabsets/${tabsetId}/tabs`)
            for (var tabsIndex in tabsResult) {
              const tab = JSON.parse(await pfs.readFile(`${dir}/tabsets/${tabsetId}/tabs/${tabsResult[tabsIndex]}`))
              ts.tabs.push(tab)
            }
          } catch (err) {
            console.warn("err", err)
          }

          tabsets.push(ts)
        } catch (err) {console.log("err", err)}
      }
    } catch (err) {
      console.warn("err", err)
    }
    for (const t of tabsets) {
      useTabsStore().addTabset(t)
    }

    return Promise.resolve(undefined);
  }

  notificationRead(notificationId: string): Promise<void> {
    return Promise.resolve(undefined);
  }

  reloadTabset(tabsetId: string): void {
  }

  removeSuggestion(id: string): any {
  }

  removeWindow(windowId: number): Promise<void> {
    return Promise.resolve(undefined);
  }

  saveActiveFeatures(val: string[]): any {
  }

  saveBlob(id: string, url: string, data: Blob, type: BlobType, remark: string | undefined): Promise<any> {
    return Promise.resolve(undefined);
  }

  saveContent(tab: Tab, text: string, metas: object, title: string, tabsetIds: string[]): Promise<any> {
    return Promise.resolve(undefined);
  }

  saveLinks(url: string, links: any): Promise<void> {
    return Promise.resolve(undefined);
  }

  saveMHtml(tab: Tab, mhtml: Blob): Promise<string> {
    return Promise.resolve("");
  }

  saveMetaLinks(url: string, metaLinks: MetaLink[]): Promise<void> {
    return Promise.resolve(undefined);
  }

  saveRequest(url: string, requestInfo: RequestInfo): Promise<void> {
    return Promise.resolve(undefined);
  }

  async saveTabset(tabset: Tabset): Promise<any> {
    // assuming new
    const tabsetFilename = `tabsets/${tabset.id}`
    await createDir("tabsets", tabset.id, "tabs")

    let strippedTabset = JSON.parse(JSON.stringify(tabset));
    const tabs = strippedTabset.tabs as Tab[]
    delete strippedTabset['tabs']
    await pfs.writeFile(`${dir}/tabsets/${tabset.id}/tabset.json`, JSON.stringify(strippedTabset), 'utf8')
    //await git.status({fs, dir, filepath: 'newfile.txt'})
    await git.add({fs, dir, filepath: tabsetFilename})

    // add / update tabs
    for(const t of tabs) {
      await pfs.writeFile(`${dir}/tabsets/${tabset.id}/tabs/${t.id}`, JSON.stringify(t), 'utf8')
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

    let pushResult = await git.push({
      fs,
      http,
      dir: '/tutorial',
      remote: 'origin',
      corsProxy: 'https://cors.isomorphic-git.org',
      ref: 'main',
      onAuth: () => ({username: process.env.GITHUB_TOKEN}),
    })
    console.log(pushResult)

    return Promise.resolve(undefined);
  }

  saveThumbnail(tab: chrome.tabs.Tab, thumbnail: string): Promise<void> {
    return Promise.resolve(undefined);
  }

  setSuggestionState(id: string, state: SuggestionState): any {
  }

  updateContent(url: string): Promise<object> {
    return Promise.resolve({});
  }

  updateGroup(group: chrome.tabGroups.TabGroup): Promise<any> {
    return Promise.resolve(undefined);
  }

  updateThumbnail(url: string): Promise<void> {
    return Promise.resolve(undefined);
  }

  updateWindow(window: Window): Promise<void> {
    return Promise.resolve(undefined);
  }

  upsertWindow(window: Window, windowName: string, screenLabel: string | undefined): Promise<void> {
    return Promise.resolve(undefined);
  }

}

export default new GitPersistenceService()
