import {Tabset} from "src/models/Tabset";
import {Space} from "src/models/Space";
import {MHtml} from "src/models/MHtml";
import {Tab} from "src/models/Tab";
import {Notification} from "src/models/Notification";
import {SearchDoc} from "src/models/SearchDoc";
import {Predicate} from "src/domain/Types";
import {LogEntry} from "src/models/LogEntry";
import {Suggestion} from "src/models/Suggestion";

interface PersistenceService {

  loadTabsets():Promise<void>
  saveTabset(tabset: Tabset): Promise<any>
  deleteTabset(tabsetId: string):Promise<any>

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
  saveMHtml(tab: Tab, mhtml: Blob): Promise<string>
  getMHtml(url: string):Promise<object>
  getMHtmlInline(url: string): Promise<object>
  getMHtmls(): Promise<MHtml[]>

  loadSpaces(): Promise<any>

  addSpace(space: Space): Promise<any>

  cleanUpRequests(): Promise<void>

  saveStats(date: string, dataset: object): void

  getNotifications(onlyNew: boolean): Promise<Notification[]>
  addNotification(notification: Notification): Promise<any>
  notificationRead(notificationId: string): Promise<void>

  getSuggestions(): Promise<Suggestion[]>
  addSuggestion(suggestion: Suggestion): Promise<any>

}

export default PersistenceService
