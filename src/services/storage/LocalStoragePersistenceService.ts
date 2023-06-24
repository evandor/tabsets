import PersistenceService from "src/services/PersistenceService";
import {Space} from "src/models/Space";
import {StaticSuggestionIdent, Suggestion, SuggestionState} from "src/models/Suggestion";
import {SearchDoc} from "src/models/SearchDoc";
import {QVueGlobals, useQuasar} from "quasar";
import {Tabset} from "src/models/Tabset";
import {Tab} from "src/models/Tab";
import {Notification} from "src/models/Notification";
import {MHtml} from "src/models/MHtml";

export class LocalStoragePersistenceService implements PersistenceService {

  private quasar: QVueGlobals;

  constructor(quasar: QVueGlobals) {
    this.quasar = quasar
  }

  deleteSpace(spaceId: string): void {
    throw new Error("Method not implemented.");
  }

  saveActiveFeatures(val: string[]) {
    if (this.quasar.localStorage) {
      this.quasar.localStorage.set("ui.activeFeatures", val)
    } else {
      console.warn("local storage not defined")
    }
  }

  setInactiveDefaultFeatures(val: string[]) {
    this.quasar.localStorage.set("ui.inActiveDefaultFeatures", val)
  }

  getActiveFeatures(): Promise<string[]> {
    return Promise.resolve(this.quasar.localStorage?.getItem('ui.activeFeatures') as string[] || [])
  }

  getInactiveDefaultFeatures(): Promise<string[]> {
    return Promise.resolve(this.quasar.localStorage?.getItem('ui.inActiveDefaultFeatures') as string[] || [])
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

  removeSuggestion(ident: StaticSuggestionIdent) {
    throw new Error("Method not implemented.");
  }

  setSuggestionState(id: string, state: SuggestionState) {
    throw new Error("Method not implemented.");
  }

  cleanUpContent(): Promise<SearchDoc[]> {
    return Promise.resolve([]);
  }

  cleanUpRequests(): Promise<void> {
    return Promise.resolve(undefined);
  }

  cleanUpThumbnails(): Promise<void> {
    return Promise.resolve(undefined);
  }

  compactDb(): Promise<any> {
    return Promise.resolve(undefined);
  }

  deleteContent(url: string): Promise<void> {
    return Promise.resolve(undefined);
  }

  deleteTabset(tabsetId: string): Promise<any> {
    return Promise.resolve(undefined);
  }

  deleteThumbnail(url: string): Promise<void> {
    return Promise.resolve(undefined);
  }

  getContent(url: string): Promise<object> {
    return Promise.resolve({});
  }

  getContents(): Promise<any[]> {
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

  loadSpaces(): Promise<any> {
    return Promise.resolve(undefined);
  }

  loadTabsets(): Promise<void> {
    return Promise.resolve(undefined);
  }

  notificationRead(notificationId: string): Promise<void> {
    return Promise.resolve(undefined);
  }

  saveContent(tab: chrome.tabs.Tab, text: string, metas: object, title: string, tabsetIds: string[]): Promise<any> {
    return Promise.resolve(undefined);
  }

  saveMHtml(tab: Tab, mhtml: Blob): Promise<string> {
    return Promise.resolve("");
  }

  saveStats(date: string, dataset: object): void {
  }

  saveTabset(tabset: Tabset): Promise<any> {
    return Promise.resolve(undefined);
  }

  saveThumbnail(tab: chrome.tabs.Tab, thumbnail: string): Promise<void> {
    return Promise.resolve(undefined);
  }

  updateContent(url: string): Promise<object> {
    return Promise.resolve({});
  }

  updateThumbnail(url: string): Promise<void> {
    return Promise.resolve(undefined);
  }

}
