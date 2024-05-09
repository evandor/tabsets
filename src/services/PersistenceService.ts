import {Tabset} from "src/tabsets/models/Tabset";
import {Tab} from "src/tabsets/models/Tab";
import {Notification} from "src/models/Notification";
import {SearchDoc} from "src/models/SearchDoc";
import {MetaLink} from "src/models/MetaLink";
import {RequestInfo} from "src/models/RequestInfo";
import {BlobType, SavedBlob} from "src/models/SavedBlob";
import {Message} from "src/models/Message";
import {Account} from "src/models/Account";

interface PersistenceService {

  getServiceName(): string

  loadTabsets():Promise<void>
  reloadTabset(tabsetId: string): void
  saveTabset(tabset: Tabset): Promise<any>
  deleteTabset(tabsetId: string):Promise<any>
  cleanUpTabsets(): Promise<void>

  getRequest(url: string): Promise<string>

  getMetaLinks(url: string): Promise<object>
  saveMetaLinks(url: string, metaLinks: MetaLink[]): Promise<void | IDBValidKey>
  getLinks(url: string): Promise<object>
  saveLinks(url: string, links: any): Promise<void | IDBValidKey>

  getBlobs(type: BlobType): Promise<any[]>
  saveBlob(id: string, url: string, data: Blob, type: BlobType, remark: string | undefined): Promise<any>
  getBlobsForTab(tabId: string): Promise<SavedBlob[]>
  deleteBlob(tabId: string, elementId: string): void;

  saveRequest(url: string, requestInfo: RequestInfo): Promise<void>

  cleanUpRequests(): Promise<void>

  getNotifications(onlyNew: boolean): Promise<Notification[]>
  addNotification(notification: Notification): Promise<any>
  notificationRead(notificationId: string): Promise<void>

  compactDb(): Promise<any>

  getActiveFeatures(): Promise<string[]>
  saveActiveFeatures(val: string[]): any

  addGroup(group: chrome.tabGroups.TabGroup): Promise<any>
  updateGroup(group: chrome.tabGroups.TabGroup): Promise<any>
  getGroups(): Promise<chrome.tabGroups.TabGroup[]>
  deleteGroupByTitle(title: string): Promise<void>

  getMessages(): Promise<Message[]>
  addMessage(msg: Message):void

  getAccount(accountId: string): Promise<Account>
  upsertAccount(account: Account):void

  clear(name: string):any

}

export default PersistenceService
