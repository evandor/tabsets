import PersistenceService from "src/services/PersistenceService";
import {IDBPDatabase} from "idb";
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
import {Notification} from "src/models/Notification";
// @ts-ignore
import {useSpacesStore} from "stores/spacesStore";
import {useAuthStore} from "stores/authStore";
import {Account} from "src/models/Account";
import {collection, deleteDoc, doc, getDocs, setDoc, updateDoc, arrayUnion} from "firebase/firestore";
import {useTabsStore} from "stores/tabsStore";
import FirebaseServices from "src/services/firebase/FirebaseServices";

function tabsetDoc(tabsetId: string) {
  return doc(FirebaseServices.getFirestore(), "users", useAuthStore().user.uid, "tabsets", tabsetId)
}

function tabsetCollection() {
  return collection(FirebaseServices.getFirestore(), "users", useAuthStore().user.uid, "tabsets")
}

function spaceDoc(spaceId: string) {
  return doc(FirebaseServices.getFirestore(), "users", useAuthStore().user.uid, "spaces", spaceId)
}

function spacesCollection() {
  return collection(FirebaseServices.getFirestore(), "users", useAuthStore().user.uid, "spaces")
}

class FirestorePersistenceService implements PersistenceService {

  getServiceName(): string {
    return "FirestorePersistenceService"
  }

  async init() {
    console.log(" ...initializing GitPersistenceService")
    return Promise.resolve("")
  }

  /**
   * === Tabsets ========================================
   */

  async loadTabsets(): Promise<void> {
    (await getDocs(tabsetCollection())).forEach((doc) => {
      let newItem = doc.data() as Tabset
      newItem.id = doc.id;
      useTabsStore().addTabset(newItem)
    })
    return Promise.resolve(undefined);
  }

  async saveTabset(tabset: Tabset): Promise<any> {
    await setDoc(tabsetDoc(tabset.id), JSON.parse(JSON.stringify(tabset)))
  }

  async deleteTabset(tabsetId: string): Promise<any> {
    await deleteDoc(tabsetDoc(tabsetId))
  }

  /**
   * === Spaces ========================================
   */

  async loadSpaces(): Promise<any> {
    (await getDocs(spacesCollection())).forEach((doc) => {
      let newItem = doc.data() as Space
      newItem.id = doc.id;
      useSpacesStore().addSpace(newItem)
    })
    return Promise.resolve(undefined);
  }

  async addSpace(entity: Space): Promise<any> {
    await setDoc(spaceDoc(entity.id), JSON.parse(JSON.stringify(entity)))
  }

  async deleteSpace(entityId: string) {
    await deleteDoc(spaceDoc(entityId))
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
    return Promise.resolve({});
  }

  getContents(): Promise<any[]> {
    return Promise.resolve([]);
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

  upsertWindow(window: Window): Promise<void> {
    return Promise.reject(undefined);
  }

  getAccount(accountId: string): Promise<Account> {
    return Promise.reject("undefined");
  }

  upsertAccount(account: Account): void {
  }

  async updateUserToken(token: string) {
    const user = useAuthStore().user
    if (user) {
      console.log("adding token", token)
      await updateDoc(doc(FirebaseServices.getFirestore(), "users", user.uid), {"fcmTokens": arrayUnion(token)})
    } else {
      console.log("not updating token, not logged in")
    }
  }
}

export default new FirestorePersistenceService()
