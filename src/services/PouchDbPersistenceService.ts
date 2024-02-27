// import PouchDB, {sync} from 'pouchdb-browser';
// import {useTabsStore} from "src/stores/tabsStore";
// import PersistenceService from "src/services/PersistenceService";
// import {Tabset, TabsetStatus} from "src/models/Tabset";
// import {useSpacesStore} from "src/stores/spacesStore";
// import {Space} from "src/models/Space";
// import {MHtml} from "src/models/MHtml";
// import {Tab} from "src/models/Tab";
// import {SearchDoc} from "src/models/SearchDoc";
// import {LogEntry} from "src/models/LogEntry";
// import {Predicate} from "src/domain/Types";
// import {Notification} from "src/models/Notification";
// import {StaticSuggestionIdent, Suggestion, SuggestionState} from "src/models/Suggestion";
// import {useAuthStore} from "src/stores/authStore";
// import {Buffer} from 'buffer';
// import {api} from "../boot/axios";
// import throttledQueue from "throttled-queue";
// import {MetaLink} from "src/models/MetaLink";
// import {LocalStorage} from "quasar";
// import {useUiStore} from "stores/uiStore";
// import {RequestInfo} from "src/models/RequestInfo";
// import {Window} from "src/models/Window";
// import {BlobType, SavedBlob} from "src/models/SavedBlob";
// import {Message} from "src/models/Message";
// import {Account} from "src/models/Account";
//
// const throttleOne10Millis = throttledQueue(1, 10, true)
//
// /**
//  * PouchDB is meant for data synchronization, specifically tabsets information. Additional data (not meant
//  * to be synchronized) will be stored in the 'normal' indexeddb (called "db" for the anonymous user)
//  *
//  * If a user logs in (Auth0), an additional pair of databases is created for each user to keep the data apart,
//  * a 'pouch' db (starting with "pouch_db-<username>") and a normal indexeddb one (called db-<username>)
//  *
//  */
// class PouchDbPersistenceService implements PersistenceService {
//
//   getServiceName(): string { return "PouchDbPersistenceService" }
//
//   loadCategories(): Promise<any> {
//     console.warn("loading categories... - not implemented")
//     return Promise.reject("loadCategories not implemented")
//   }
//
//   private db: undefined | PouchDB.Database<{}> & {} = undefined;
//
//   private remoteDB: undefined | PouchDB.Database<{}> & {} = undefined
//
//   async init(dbName: string) {
//     const isAuthenticated = useAuthStore().isAuthenticated
//     console.debug("PouchDB: initializing pouchdb:", dbName, isAuthenticated)
//     this.db = new PouchDB(dbName)
//     this.syncIfAuthenticated()
//   }
//
//   /**
//    * new user:
//    *
//    * curl -X PUT https://admin:3Zmd...@cdb.skysail.io/_users/org.couchdb.user:auth0|641d4ef02fed75bb3d235f4b -H "Accept: application/json" -H "Content-Type: application/json" -d '{"name": "izzy", "password": "apple", "roles": [], "type": "user"}'
//    *
//    *
//    * in couchdb /etc/local.init:
//    *
//    * [chttpd]
//    * authentication_handlers = {chttpd_auth, cookie_authentication_handler}, {chttpd_auth, jwt_authentication_handler}, {chttpd_auth, default_authentication_handler}
//    * [jwt_auth]
//    * required_claims =
//    * [jwt_keys]
//    * hmac:foo = aGVsbG8=
//    * rsa:MzEx...yNw = -----BEGIN PUBLIC KEY-----\nMIIBIjANBgkq...D45YsMSR\nXQIDAQAB\n-----END PUBLIC KEY-----\n
//    * ~
//    * MzEx... from token 'kid'
//    * MIIBI... from skysail curl -s ...auth0.com/pem | openssl x509 -pubkey -noout
//    */
//   async initRemoteDb(): Promise<void> {
//     const user = useAuthStore().user
//     const user_id: string = user['sub' as keyof object]?.replace("|", "-") || ''
//     // const token = sign({sub: user_id}, "process.env.SECRET_KEY", {
//     //   expiresIn: 3600,
//     // });
//
//     if (user && user['sub' as keyof object]) {
//       // console.log("4initializing remote db with user", user)
//
//       let useToken = ''
//       const accessToken = await useAuthStore().getAccessTokenSilently
//       const config = {headers: {Authorization: 'Bearer ' + accessToken,}}
//       const res = await api.get(`${process.env.BACKEND_URL}/couchdb/token`, config)
//       useToken = res.data.token
//
//       const dbName = "userdb-" + Buffer.from(user_id).toString('hex')
//       const dbUrl = `${process.env.COUCHDB_PROTOCOL}${process.env.COUCHDB_URL}/${dbName}`
//       this.remoteDB = new PouchDB(dbUrl,
//         {
//           fetch: function (url, opts) {
//             // console.log("url...", url)
//             // console.log("opts...", opts)
//
//             if (opts && opts.headers) {
//               // @ts-ignore
//               opts.headers.set('Authorization', 'Bearer ' + useToken);
//             }
//             //console.log("opts2", url, opts?.headers)
//             return PouchDB.fetch(url, opts);
//           }
//         })
//       this.syncIfAuthenticated()
//     }
//   }
//
//   async saveTabset(tabset: Tabset): Promise<any> {
//
//     return throttleOne10Millis(async () => {
//       console.log("saving tabset", tabset, this.db)
//       if (!tabset._id) {
//         // console.log("saving tabset with _id", tabset)
//         // return Promise.reject("pouch db not initialized2")
//         tabset._id = "tabset:" + new Date().toJSON()
//       }
//       if (this.db) {
//         return this.db.put(JSON.parse(JSON.stringify(tabset)))
//           .then((res: PouchDB.Core.Response) => {
//             this.syncIfAuthenticated(true)
//             return res.rev
//           })
//       }
//       return Promise.reject("pouch db not initialized")
//     })
//   }
//
//
//   async loadTabsets(): Promise<void> {
//     const tabsStore = useTabsStore()
//     tabsStore.tabsets.clear()
//     if (this.db) {
//
//       try {
//         const result =
//           await this.db.allDocs({include_docs: true, startkey: 'tabset:', endkey: 'tabset:\uffff'});
//         result.rows.forEach(row => {
//           // console.log("row.doc1", row.doc)
//           // @ts-ignore
//           tabsStore.addTabset(row.doc)
//         })
//         return Promise.resolve();
//       } catch (err) {
//         console.log(err);
//         return Promise.reject(err)
//       }
//
//       // this.db.allDocs({include_docs: true, startkey: 'tabset:'})
//       //   .then(function (result) {
//       //     result.rows.forEach(row => {
//       //       console.log("row.doc2", row.doc)
//       //       //tabsStore.addTabset(row.doc)
//       //     })
//       //   }).catch(function (err) {
//       //     console.log(err);
//       //   });
//
//       // this.db.allDocs({include_docs: true, startkey: 'tabset:'},
//       //   (docs: PouchDB.Core.AllDocsResponse<any>) => {
//       //     docs.rows.forEach(row => {
//       //       tabsStore.addTabset(row.doc)
//       //     })
//       //   })
//       //return Promise.resolve();
//     }
//     return Promise.reject("pouch db not initialized")
//   }
//
//   reloadTabset(tabsetId: string): void {
//     console.warn("no op in reload tabset")
//   }
//
//   addNotification(notification: Notification): Promise<any> {
//     notification._id = "notification:" + new Date().toJSON()
//     if (this.db) {
//       return this.db.put(notification)
//         .then((res: any) => {
//           this.syncIfAuthenticated(true)
//           return res;
//         })
//     }
//     return Promise.reject("pouch db not initialized")
//   }
//
//   addSpace(space: Space): Promise<any> {
//     space._id = "space:" + new Date().toJSON()
//     if (this.db) {
//       return this.db.put(space)
//         .then((res: any) => {
//           this.syncIfAuthenticated(true)
//           return res;
//         })
//     }
//     return Promise.reject("pouch db not initialized")
//   }
//
//   loadSpaces(): Promise<any> {
//     const store = useSpacesStore()
//     if (this.db) {
//       this.db.allDocs({include_docs: true, startkey: 'space:', endkey: 'tabset:', inclusive_end: false})
//         .then((docs: PouchDB.Core.AllDocsResponse<any>) => {
//           docs.rows.forEach(row => {
//             //console.log("adding space from pouchDB", row.doc)
//             store.putSpace(row.doc)
//           })
//         })
//       return Promise.resolve();
//     }
//     return Promise.reject("pouch db not initialized")
//   }
//
//   async getActiveFeatures(): Promise<string[]> {
//     if (this.db) {
//       try {
//         const f = await this.db.get("activeFeatures")
//         if (f) {
//           return Promise.resolve(f['activeFeatures' as keyof object])
//         }
//       } catch (err) {
//         console.log("got error", err)
//       }
//     }
//     return Promise.resolve([])
//   }
//
//   async getInactiveDefaultFeatures(): Promise<string[]> {
//     if (this.db) {
//       try {
//         const f = await this.db.get("inActiveDefaultFeatures")
//         if (f) {
//           return Promise.resolve(f['inActiveDefaultFeatures' as keyof object])
//         }
//       } catch (err) {
//         console.log("got error", err)
//       }
//     }
//     return Promise.resolve([])
//   }
//
//   async getSyncInfo(versionIfNotDefined: number = 0): Promise<object> {
//     if (this.remoteDB) {
//       try {
//         const f = await this.remoteDB.get("sync")
//         if (f) {
//           return Promise.resolve(f)
//         }
//       } catch (err: any) {
//         console.log("got error", err)
//         if (err.status === 404) {
//           console.log("trying to initialize syncVersion with", versionIfNotDefined)
//           const data = {
//             _id: "sync",
//             syncVersion: versionIfNotDefined
//           }
//           this.remoteDB.put(data)
//         }
//       }
//     }
//     return Promise.resolve([])
//   }
//
//   async increaseSyncVersion() {
//     console.log("increasing SyncVersion")
//     if (this.db) {
//       let newSyncVersion = 1
//       try {
//         const sync = await this.db.get("sync")
//
//         if (sync) {
//           newSyncVersion = sync['syncVersion' as keyof object] ?
//             sync['syncVersion' as keyof object] + 1 : 1
//           console.log("updating syncVersion", sync['syncVersion' as keyof object], newSyncVersion)
//           const data = {
//             _id: "sync",
//             _rev: sync._rev,
//             // sync: val
//             syncVersion: newSyncVersion
//           }
//           //console.log("updating with data", data)
//           this.db.put(data)
//             //.then(() => this.syncIfAuthenticated())
//             .catch((err: any) => {
//               if (err && err['status'] && err['status'] == 409) {
//                 console.log("got conflict", err)
//               } else {
//                 console.log("error updating features", err)
//               }
//             })
//         }
//       } catch (err) {
//         const data = {
//           _id: "sync",
//           syncVersion: newSyncVersion
//         }
//         console.log("adding data", data)
//         this.db.put(data)
//       }
//       LocalStorage.set('ui.syncVersion', newSyncVersion)
//     }
//     return Promise.resolve()
//   }
//
//   addSuggestion(suggestion: Suggestion): Promise<any> {
//     // suggestion._id = "suggestion:" + new Date().toJSON()
//     // if (this.db) {
//     //     return this.db.put(suggestion)
//     //         .then((res: any) => {
//     //             this.syncIfAuthenticated(true)
//     //             return res;
//     //         })
//     // }
//     return Promise.reject("not implemented")
//   }
//
//   cleanUpContent(): Promise<SearchDoc[]> {
//     console.warn("cleaupUpContent not implemented yet in pouchdb")
//     return Promise.resolve([]);
//   }
//
//   cleanUpRequests(): Promise<void> {
//     console.warn("cleanUpRequests not implemented yet in pouchdb")
//     return Promise.resolve(undefined);
//   }
//
//   cleanUpThumbnails(): Promise<void> {
//     console.warn("cleanUpThumbnails not implemented yet in pouchdb")
//     return Promise.resolve(undefined);
//   }
//
//   deleteContent(url: string): Promise<void> {
//     console.warn("deleteContent not implemented yet in pouchdb")
//     return Promise.resolve(undefined);
//   }
//
//   async deleteTabset(_id: string): Promise<any> {
//     console.log("deleting tabset _id", _id)
//     if (this.db) {
//       const doc = await this.db.get(_id)//.then(function (doc) {
//       return this.db.remove(doc);
//     }
//     return Promise.reject("pouch db not initialized")
//   }
//
//   deleteThumbnail(url: string): Promise<void> {
//     return Promise.resolve(undefined);
//   }
//
//   getContent(url: string): Promise<object> {
//     return Promise.resolve({});
//   }
//
//   getContents(): Promise<any[]> {
//     return Promise.resolve([]);
//   }
//
//   getLinks(url: string): Promise<object> {
//     return Promise.resolve({});
//   }
//
//   getLogs(predicate: Predicate<LogEntry>): Promise<LogEntry[]> {
//     return Promise.resolve([]);
//   }
//
//   getMHtml(url: string): Promise<object> {
//     return Promise.resolve({});
//   }
//
//   getMHtmlInline(url: string): Promise<object> {
//     return Promise.resolve({});
//   }
//
//   getMHtmls(): Promise<MHtml[]> {
//     return Promise.resolve([]);
//   }
//
//   getMetaLinks(url: string): Promise<object> {
//     return Promise.resolve({});
//   }
//
//   getNotifications(onlyNew: boolean): Promise<Notification[]> {
//     return Promise.resolve([]);
//   }
//
//   getRequest(url: string): Promise<string> {
//     return Promise.resolve("");
//   }
//
//   getSuggestions(): Promise<Suggestion[]> {
//     return Promise.resolve([]);
//   }
//
//   getThumbnail(url: string): Promise<string> {
//     return Promise.resolve("");
//   }
//
//   notificationRead(notificationId: string): Promise<void> {
//     return Promise.resolve(undefined);
//   }
//
//   saveContent(tab: Tab, text: string, metas: object, title: string, tabsetIds: string[]): Promise<any> {
//     console.log("in save content - no op", tab, text, metas)
//     return Promise.resolve(undefined);
//   }
//
//   saveMHtml(tab: Tab, mhtml: Blob): Promise<string> {
//     return Promise.resolve("");
//   }
//
//   saveStats(date: string, dataset: object): void {
//   }
//
//
//   saveThumbnail(tab: chrome.tabs.Tab, thumbnail: string): Promise<void> {
//     return Promise.resolve(undefined);
//   }
//
//   updateContent(url: string): Promise<object> {
//     return Promise.resolve({});
//   }
//
//   updateThumbnail(url: string): Promise<void> {
//     return Promise.resolve(undefined);
//   }
//
//   async addGroup(group: chrome.tabGroups.TabGroup): Promise<any> {
//
//     const groups = await this.getGroups()
//     groups.push(group)
//     const groupAsObject = JSON.parse(JSON.stringify(group))
//     groupAsObject['_id'] = "group:" + group.title//"group:" + new Date().toJSON()
//     if (this.db) {
//       console.log("adding group to pouchDB", groupAsObject)
//       return this.db.put(groupAsObject)
//         .then((res: any) => {
//           this.syncIfAuthenticated(true)
//           return res;
//         })
//         .catch((err) => {
//           console.log("error at addGroup", err)
//         })
//     }
//     return Promise.reject("pouch db not initialized")
//   }
//
//   updateGroup(group: chrome.tabGroups.TabGroup): Promise<any> {
//     const groupAsObject = JSON.parse(JSON.stringify(group))
//     groupAsObject['_id'] = "group:" + group.title//"group:" + new Date().toJSON()
//     if (this.db) {
//       console.log("updating group to pouchDB", groupAsObject)
//       return this.db.put(groupAsObject)
//         .then((res: any) => {
//           this.syncIfAuthenticated(true)
//           return res;
//         })
//     }
//     return Promise.reject("pouch db not initialized")
//   }
//
//   async getGroups(): Promise<chrome.tabGroups.TabGroup[]> {
//     if (!this.db) {
//       return Promise.reject("pouch db not initialized")
//     }
//     // try {
//     //     const doc = await this.db.get('groups')
//     //     console.log("here2")
//     //     const groups = doc['groups' as keyof object] as chrome.tabGroups.TabGroup[] || []
//     //     console.log("getting group from pouchDB", groups)
//     //     return Promise.resolve(groups)
//     // } catch (err:any) {
//     //     console.log("got error", err)
//     //     return Promise.resolve([])
//     // }
//     const docs: PouchDB.Core.AllDocsResponse<any> = await this.db.allDocs({
//       include_docs: true,
//       startkey: 'group:',
//       endkey: 'group:\uffff'
//     })
//     //    .then((docs: PouchDB.Core.AllDocsResponse<any>) => {
//     const groups: chrome.tabGroups.TabGroup[] = []
//     docs.rows.forEach((row: any) => {
//       console.log("getting group from pouchDB", row.doc)
//       groups.push(row.doc)
//     })
//     return Promise.resolve(groups)
//     //     })
//   }
//
//   async deleteGroupByTitle(title: string): Promise<void> {
//     if (this.db) {
//       return this.db.allDocs({include_docs: true, startkey: 'groups:', endkey: 'groups:\uffff'})
//         .then((docs: PouchDB.Core.AllDocsResponse<any>) => {
//           const groups: chrome.tabGroups.TabGroup[] = []
//           docs.rows.forEach(row => {
//             if (row.doc.title === title) {
//               console.log("deleting group from pouchDB", row.doc)
//               this.db?.remove(row.doc)
//             }
//           })
//           return Promise.resolve()
//         })
//       return Promise.resolve();
//     }
//     return Promise.reject("pouch db not initialized")
//   }
//
//   /*** Windows Management: not handled in PouchDB ***/
//
//   addWindow(window: Window): Promise<any> {
//     return Promise.reject("not implemented")
//   }
//
//   getWindows(): Promise<Window[]> {
//     return Promise.reject("not implemented")
//   }
//
//   getWindow(windowId: number): Promise<Window | undefined> {
//     return Promise.reject("not implemented")
//   }
//
//   removeWindow(windowId: number): Promise<void> {
//     return Promise.reject("not implemented")
//   }
//
//   updateWindow(window: Window): Promise<void> {
//     return Promise.reject("not implemented")
//   }
//
//   upsertWindow(window: Window): Promise<void> {
//     return Promise.reject("not implemented")
//   }
//
//
//   private async syncIfAuthenticated(increaseVersion = false) {
//     if (this.db && useAuthStore().isAuthenticated && this.remoteDB) {
//       const start = new Date().getTime()
//       try {
//         useUiStore().dbSyncing = true
//         console.log("about to sync", useAuthStore().isAuthenticated)
//         const currentUsername = useAuthStore().user.name
//         console.log("syncing using username", currentUsername)
//         if (currentUsername === "demo+tabsets@skysail.io" && process.env.MODE === 'pwa') {
//           console.log("one-way synchronizing pouchdb")
//           this.remoteDB.replicate.to(this.db).on('complete', function () {
//           }).on('error', function (err: any) {
//             console.log("got error!", err)
//           });
//         } else {
//           console.log("syncing with remote db")
//           if (increaseVersion) {
//             await this.increaseSyncVersion()
//           } else {
//             try {
//               const sync = await this.db.get("sync")
//               if (sync) {
//                 LocalStorage.set("ui.syncVersion", sync['syncVersion' as keyof object])
//               }
//             } catch (err) {
//               console.log("could not set local storage #ui.syncVersion to", err)
//             }
//           }
//           this.db.sync(this.remoteDB)
//         }
//         useUiStore().dbSyncing = false
//         console.log("sync finished", new Date().getTime() - start)
//       } catch (err) {
//         console.log("sync got error", err)
//         useUiStore().dbSyncing = false
//       }
//     }
//   }
//
//   deleteSpace(spaceId: string) {
//
//   }
//
//   syncNow() {
//     this.syncIfAuthenticated()
//   }
//
//   compactDb(): Promise<any> {
//     if (this.db) {
//       return this.db.compact().then(function (result) {
//         console.log("db compacted")
//       }).catch(function (err: any) {
//         console.log(err);
//       });
//     }
//     return Promise.reject("db not ready for compaction")
//   }
//
//   async saveActiveFeatures(val: string[]) {
//     console.log("saving val in pouchdb - saveActiveFeatures", val)
//     if (this.db && val) {
//       // ignore revision
//       try {
//         const af = await this.db.get("activeFeatures")
//         if (af) {
//           const data = {
//             _id: "activeFeatures",
//             _rev: af._rev,
//             activeFeatures: val
//           }
//           this.db.put(data)
//             .then(() => this.syncIfAuthenticated())
//             .catch((err) => {
//               if (err && err['status'] && err['status'] == 409) {
//                 // ignore conflict - this can happen when setting features via messages
//               } else {
//                 console.log("error updating features", err)
//               }
//             })
//         }
//       } catch (err) {
//         const data = {
//           _id: "activeFeatures",
//           activeFeatures: val
//         }
//         this.db.put(data).then(() => this.syncIfAuthenticated())
//       }
//     }
//     return Promise.resolve()
//   }
//
//   async setInActiveDefaultFeatures(val: string[]) {
//     console.log("saving val in pouchdb - setInActiveDefaultFeatures", val)
//     if (this.db && val) {
//       // ignore revision
//       try {
//         const af = await this.db.get("inActiveDefaultFeatures")
//         if (af) {
//           const data = {
//             _id: "inActiveDefaultFeatures",
//             _rev: af._rev,
//             inActiveDefaultFeatures: val
//           }
//           this.db.put(data).then(() => this.syncIfAuthenticated())
//             .catch((err: any) => {
//               if (err && err['status'] && err['status'] == 409) {
//                 // ignore conflict - this can happen when setting features via messages
//               } else {
//                 console.log("error updating features", err)
//               }
//             })
//         }
//       } catch (err) {
//         const data = {
//           _id: "inActiveDefaultFeatures",
//           inActiveDefaultFeatures: val
//         }
//         this.db.put(data).then(() => this.syncIfAuthenticated())
//       }
//     }
//     return Promise.resolve([])
//   }
//
//   removeSuggestion(ident: StaticSuggestionIdent): any {
//   }
//
//   setSuggestionState(id: string, state: SuggestionState): any {
//   }
//
//   async cleanUpTabsets(): Promise<void> {
//     if (this.db) {
//       try {
//         const ts = await this.db.allDocs({include_docs: true, startkey: 'tabset:', endkey: 'tabset:\uffff'});
//         ts.rows.forEach(row => {
//           //console.log("got row", row.doc)
//           const tabset = row.doc as unknown as Tabset
//           if (tabset.status === TabsetStatus.DELETED && row.doc) {
//             //this.db?.remove(row.doc)
//             // const tsTabId = "tsTabs:" + row.doc._id.replace("tabset:", "")
//             //console.log("about to delete", tsTabId)
//             //this.db?.get(tsTabId).then((doc) => this.db?.remove(doc))
//           }
//         })
//         return Promise.resolve()
//       } catch (err) {
//         console.log("cleanup Tabset issue", err)
//       }
//     }
//     return Promise.reject("db not available")
//
//     /*    const objectStore = this.db.transaction("tabsets", "readwrite").objectStore("tabsets");
//         let cursor = await objectStore.openCursor()
//         while (cursor) {
//           if (cursor.value.status === TabsetStatus.DELETED) {
//             console.log("cleanup: deleteing stale tabset", cursor.key)
//             objectStore.delete(cursor.key)
//           }
//           cursor = await cursor.continue();
//         }*/
//
//
//   }
//
//   clear(name: string): any {
//
//   }
//
//   getBlob(blobId: string): Promise<any> {
//     return Promise.resolve(undefined);
//   }
//
//   saveBlob(id: string, url: string, data: Blob, type: string): Promise<any> {
//     return Promise.resolve(undefined);
//   }
//
//   saveLinks(url: string, links: any): Promise<void> {
//     return Promise.resolve(undefined);
//   }
//
//   saveMetaLinks(url: string, metaLinks: MetaLink[]): Promise<void> {
//     return Promise.resolve(undefined);
//   }
//
//   saveRequest(url: string, requestInfo: RequestInfo): Promise<void> {
//     return Promise.resolve(undefined);
//   }
//
//   async getRemoteState() {
//     const result =
//       await this.remoteDB?.allDocs({include_docs: true, startkey: 'tabset:', endkey: 'tabset:\uffff'});
//
//     return result?.rows.length || 0
//   }
//
//   deleteBlob(tabId: string, elementId: string): void {
//   }
//
//   deleteMHtml(id: string): Promise<void> {
//     return Promise.resolve(undefined);
//   }
//
//   getBlobs(type: BlobType): Promise<any[]> {
//     return Promise.resolve([]);
//   }
//
//   getBlobsForTab(tabId: string): Promise<SavedBlob[]> {
//     return Promise.resolve([]);
//   }
//
//   addMessage(msg: Message): void {
//   }
//
//   getMessages(): Promise<Message[]> {
//     return Promise.resolve([]);
//   }
//
//   getAccount(accountId: string): Promise<Account> {
//     return Promise.reject("not implemented");
//   }
//
//   upsertAccount(account: Account): void {
//   }
// }
//
// export default new PouchDbPersistenceService()
