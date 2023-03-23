import PouchDB from 'pouchdb-browser';
// var PouchDB = require('pouchdb-browser');
import {IDBPDatabase, openDB} from "idb";
import {useTabsStore} from "src/stores/tabsStore";
import _ from "lodash";
import {INDEX_DB_NAME, INDEX_DB_VERSION, EXPIRE_DATA_PERIOD_IN_MINUTES} from "boot/constants";
import PersistenceService from "src/services/PersistenceService";
import {Tabset, TabsetStatus} from "src/models/Tabset";
import mhtml2html from 'mhtml2html';
import {useSpacesStore} from "src/stores/spacesStore";
import {Space} from "src/models/Space";
import {MHtml} from "src/models/MHtml";
import {Tab} from "src/models/Tab";
import {SearchDoc} from "src/models/SearchDoc";
import {RequestInfo} from "src/models/RequestInfo";
import {MetaLink} from "src/models/MetaLink";
import {LogEntry} from "src/models/LogEntry";
import {LogLevel} from "logging-library";
import {Predicate} from "src/domain/Types";
import {TabLogger} from "src/logging/TabLogger";
import {StatsEntry} from "src/models/StatsEntry";
import {uid} from "quasar";
import {Notification, NotificationStatus} from "src/models/Notification";
import {StaticSuggestionIdent, Suggestion, SuggestionState} from "src/models/Suggestion";

class PouchDbPersistenceService implements PersistenceService {

  private db = new PouchDB('ts');
  private remoteDB = new PouchDB(`${process.env.COUCHDB_PROTOCOL}admin:${process.env.COUCHDB_PWD}@${process.env.COUCHDB_URL}/ts-4711`)

  async init() {
    console.debug("initializing database remote sync setup")
    this.db.sync(this.remoteDB);
  }

  saveTabset(tabset: Tabset): Promise<any> {
    tabset._id = "tabset:" + new Date().toJSON()
    return this.db.put(JSON.parse(JSON.stringify(tabset)))
      .then(() => this.db.sync(this.remoteDB))
  }

  loadTabsets(): Promise<void> {
    const tabsStore = useTabsStore()
    this.db.allDocs({include_docs: true, startkey: 'tabset:',})
      .then((docs:PouchDB.Core.AllDocsResponse<any>) => {
        docs.rows.forEach(row => {
          tabsStore.addTabset(row.doc)
        })
      })
    return Promise.resolve();
  }

  addNotification(notification: Notification): Promise<any> {
    notification._id = "notification:" + new Date().toJSON()
    return this.db.put(notification)
      .then(() => this.db.sync(this.remoteDB))
  }

  addSpace(space: Space): Promise<any> {
    space._id = "space:" + new Date().toJSON()
    return this.db.put(space)
      .then(() => this.db.sync(this.remoteDB))
  }

  loadSpaces(): Promise<any> {
    const store = useSpacesStore()
    this.db.allDocs({include_docs: true, startkey: 'space:',})
      .then((docs:PouchDB.Core.AllDocsResponse<any>) => {
        docs.rows.forEach(row => {
          store.putSpace(row.doc)
        })
      })
    return Promise.resolve();
  }

  addSuggestion(suggestion: Suggestion): Promise<any> {
    suggestion._id = "suggestion:" + new Date().toJSON()
    return this.db.put(suggestion)
      .then(() => this.db.sync(this.remoteDB))
  }

  cleanUpContent(): Promise<SearchDoc[]> {
    console.warn("cleaupUpContent not implemented yet in pouchdb")
    return Promise.resolve([]);
  }

  cleanUpRequests(): Promise<void> {
    console.warn("cleanUpRequests not implemented yet in pouchdb")
    return Promise.resolve(undefined);
  }

  cleanUpThumbnails(): Promise<void> {
    console.warn("cleanUpThumbnails not implemented yet in pouchdb")
    return Promise.resolve(undefined);
  }

  deleteContent(url: string): Promise<void> {
    console.warn("deleteContent not implemented yet in pouchdb")
    return Promise.resolve(undefined);
  }

  async deleteTabset(_id: string): Promise<any> {
    console.log("deleting tabset _id", _id)
    const doc = await this.db.get(_id)//.then(function (doc) {
    return this.db.remove(doc);
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

  getLogs(predicate: Predicate<LogEntry>): Promise<LogEntry[]> {
    return Promise.resolve([]);
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

  notificationRead(notificationId: string): Promise<void> {
    return Promise.resolve(undefined);
  }

  saveContent(tab: chrome.tabs.Tab, text: string, metas: object, title: string, tabsetIds: string[]): Promise<any> {
    return Promise.resolve(undefined);
  }

  saveLog(context: string, level: LogLevel, msg: string, ...args: any[]): Promise<any> {
    return Promise.resolve(undefined);
  }

  saveMHtml(tab: Tab, mhtml: Blob): Promise<string> {
    return Promise.resolve("");
  }

  saveStats(date: string, dataset: object): void {
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

export default  new PouchDbPersistenceService()
