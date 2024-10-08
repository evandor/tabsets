import {Notification} from "src/models/Notification";
import {MetaLink} from "src/models/MetaLink";
import {RequestInfo} from "src/models/RequestInfo";

// Deprecated
interface PersistenceService {

  getServiceName(): string

  getRequest(url: string): Promise<string>

  getMetaLinks(url: string): Promise<object>
  saveMetaLinks(url: string, metaLinks: MetaLink[]): Promise<void | IDBValidKey>
  getLinks(url: string): Promise<object>
  saveLinks(url: string, links: any): Promise<void | IDBValidKey>

  saveRequest(url: string, requestInfo: RequestInfo): Promise<void>

  cleanUpRequests(): Promise<void>

  getNotifications(onlyNew: boolean): Promise<Notification[]>
  addNotification(notification: Notification): Promise<any>
  notificationRead(notificationId: string): Promise<void>

  compactDb(): Promise<any>

  getActiveFeatures(): Promise<string[]>
  saveActiveFeatures(val: string[]): any

  // getMessages(): Promise<Message[]>
  // addMessage(msg: Message):void

  clear(name: string):any

}

export default PersistenceService
