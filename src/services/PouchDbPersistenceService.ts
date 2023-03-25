import PouchDB from 'pouchdb-browser';
import {useTabsStore} from "src/stores/tabsStore";
import PersistenceService from "src/services/PersistenceService";
import {Tabset, TabsetStatus} from "src/models/Tabset";
import {useSpacesStore} from "src/stores/spacesStore";
import {Space} from "src/models/Space";
import {MHtml} from "src/models/MHtml";
import {Tab} from "src/models/Tab";
import {SearchDoc} from "src/models/SearchDoc";
import {LogEntry} from "src/models/LogEntry";
import {LogLevel} from "logging-library";
import {Predicate} from "src/domain/Types";
import {Notification} from "src/models/Notification";
import {Suggestion} from "src/models/Suggestion";
import {useAuthStore} from "stores/auth";

class PouchDbPersistenceService implements PersistenceService {

  private db = new PouchDB('ts');
  private remoteDB: undefined | PouchDB.Database<{}> & {} = undefined //new PouchDB(`${process.env.COUCHDB_PROTOCOL}admin:${process.env.COUCHDB_PWD}@${process.env.COUCHDB_URL}/ts-4711`)
  async init() {
    const isAuthenticated = useAuthStore().isAuthenticated
    console.debug("initializing database remote sync setup", isAuthenticated)
    if (isAuthenticated && this.remoteDB) {
      this.db.sync(this.remoteDB);
    }
  }

  /**
   * new user:
   *
   * curl -X PUT https://admin:3Zmd...@cdb.skysail.io/_users/org.couchdb.user:auth0|641d4ef02fed75bb3d235f4b -H "Accept: application/json" -H "Content-Type: application/json" -d '{"name": "izzy", "password": "apple", "roles": [], "type": "user"}'
   *
   *
   * in couchdb /etc/local.init:
   *
   * [chttpd]
   * authentication_handlers = {chttpd_auth, cookie_authentication_handler}, {chttpd_auth, jwt_authentication_handler}, {chttpd_auth, default_authentication_handler}
   * [jwt_auth]
   * required_claims =
   * [jwt_keys]
   * hmac:foo = aGVsbG8=
   * rsa:MzEx...yNw = -----BEGIN PUBLIC KEY-----\nMIIBIjANBgkq...D45YsMSR\nXQIDAQAB\n-----END PUBLIC KEY-----\n
   * ~
   * MzEx... from token 'kid'
   * MIIBI... from skysail curl -s ...auth0.com/pem | openssl x509 -pubkey -noout
   */
  initRemoteDb() {
    console.log("initializing remote db")
    const user = useAuthStore().user
    console.log("initializing remote db", user)
    if (user && user['sub']) {
      const user_id:string = user['sub']
      const dbname = "ts-" + user['sub']
      console.log("initializing remote db", dbname)
      this.remoteDB = new PouchDB(`${process.env.COUCHDB_PROTOCOL}${process.env.COUCHDB_URL}/ts-auth0-641d4ef02fed75bb3d235f4b`,
        {
          fetch: async function (url, opts) {
            console.log("url", url)
            // console.log("opts", opts?.headers)
            const token = await useAuthStore().auth0.getAccessTokenSilently()
            console.log("token", token)

            if (opts && opts.headers) {
              // @ts-ignore
              opts.headers.set('Authorization', 'Bearer ' +  token  );
              // @ts-ignore
              //opts.headers.set('X-Auth-CouchDB-UserName', 'foo')//user_id.replace('|','-')  );
              // @ts-ignore
              //opts.headers.set('X-Auth-CouchDB-Token', '22047ebd7c4ec67dfbcbad7213a693249dbfbf86')//user_id.replace('|','-')  );
            }
            // console.log("opts2", opts?.headers)
            return PouchDB.fetch(url, opts);
          }
        })
      //this.remoteDB = new PouchDB(`${process.env.COUCHDB_PROTOCOL}izzy:apple@${process.env.COUCHDB_URL}/ts-auth0-641d4ef02fed75bb3d235f4b`)
      this.db.sync(this.remoteDB)
    }
  }

  saveTabset(tabset: Tabset): Promise<any> {
    tabset._id = "tabset:" + new Date().toJSON()
    return this.db.put(JSON.parse(JSON.stringify(tabset)))
      .then(this.syncIfAuthenticated())
  }


  loadTabsets(): Promise<void> {
    const tabsStore = useTabsStore()
    this.db.allDocs({include_docs: true, startkey: 'tabset:',})
      .then((docs: PouchDB.Core.AllDocsResponse<any>) => {
        docs.rows.forEach(row => {
          tabsStore.addTabset(row.doc)
        })
      })
    return Promise.resolve();
  }

  addNotification(notification: Notification): Promise<any> {
    notification._id = "notification:" + new Date().toJSON()
    return this.db.put(notification)
      .then(this.syncIfAuthenticated())
  }

  addSpace(space: Space): Promise<any> {
    space._id = "space:" + new Date().toJSON()
    return this.db.put(space)
      .then(this.syncIfAuthenticated())
  }

  loadSpaces(): Promise<any> {
    const store = useSpacesStore()
    this.db.allDocs({include_docs: true, startkey: 'space:',})
      .then((docs: PouchDB.Core.AllDocsResponse<any>) => {
        docs.rows.forEach(row => {
          store.putSpace(row.doc)
        })
      })
    return Promise.resolve();
  }

  addSuggestion(suggestion: Suggestion): Promise<any> {
    suggestion._id = "suggestion:" + new Date().toJSON()
    return this.db.put(suggestion)
      .then(this.syncIfAuthenticated())
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

  private syncIfAuthenticated() {
    return () => {
      if (useAuthStore().isAuthenticated && this.remoteDB) {
        console.log("synchronizing pouchdb")
        this.db.sync(this.remoteDB);
      }
    }
  }

}

export default new PouchDbPersistenceService()
