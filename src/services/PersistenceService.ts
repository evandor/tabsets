import {Tabset} from "src/models/Tabset";
import {Space} from "src/models/Space";
import {MHtml} from "src/models/MHtml";
import {Tab} from "src/models/Tab";
import {Notification} from "src/models/Notification";
import {SearchDoc} from "src/models/SearchDoc";
import {LogLevel} from "logging-library";
import {Predicate} from "src/domain/Types";
import {LogEntry} from "src/models/LogEntry";

interface PersistenceService {

  loadTabsets():Promise<void>
  saveTabset(tabset: Tabset): Promise<any>
  deleteTabset(tabsetId: string):Promise<void>

  updateThumbnail(url: string):Promise<void>
  saveThumbnail(tab: chrome.tabs.Tab, thumbnail: string):Promise<void>
  getThumbnail(url: string):Promise<string>
  deleteThumbnail(url: string):Promise<void>
  cleanUpThumbnails():Promise<void>

  getContent(url: string):Promise<object>
  updateContent(url: string):Promise<object>
  deleteContent(url: string):Promise<void>
  saveContent(tab: chrome.tabs.Tab, text: string, metas: object, title: string, tabsetIds: string[]):Promise<any>
  cleanUpContent(): Promise<SearchDoc[]>
  getContents(): Promise<any[]>

  getRequest(url: string): Promise<string>

  getMetaLinks(url: string): Promise<object>
  getLinks(url: string): Promise<object>
  saveMHtml(tab: Tab, mhtml: string): Promise<any>
  getMHtml(url: string):Promise<object>
  getMHtmlInline(url: string): Promise<object>
  getMHtmls(): Promise<MHtml[]>

  addSpace(space: Space): Promise<void>

  cleanUpRequests(): Promise<void>

  saveStats(date: string, dataset: object): void

  getNotifications(onlyNew: boolean): Promise<Notification[]>
  addNotification(notification: Notification): Promise<void>
  notificationRead(notificationId: string): Promise<void>

  getLogs(predicate: Predicate<LogEntry>): Promise<LogEntry[]>
  saveLog(context: string, level: LogLevel, msg: string, ...args: any[]):Promise<any>
}

export default PersistenceService
