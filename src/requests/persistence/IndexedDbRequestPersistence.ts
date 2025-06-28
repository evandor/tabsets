import { IDBPDatabase, openDB } from 'idb'
import { RequestInfo } from 'src/requests/models/RequestInfo'
import RequestsPersistence from 'src/requests/persistence/RequestsPersistence'

class IndexedDbRequestPersistence implements RequestsPersistence {
  private STORE_IDENT = 'requests'

  private db: IDBPDatabase = null as unknown as IDBPDatabase

  getServiceName(): string {
    return this.constructor.name
  }

  async init() {
    this.db = await this.initDatabase()
    // console.debug(` ...initialized requests: ${this.getServiceName()}`, '✅')
    return Promise.resolve()
  }

  private async initDatabase(): Promise<IDBPDatabase> {
    const ctx = this
    return await openDB('requestsDB', 1, {
      upgrade(db) {
        if (!db.objectStoreNames.contains(ctx.STORE_IDENT)) {
          console.log('creating db ' + ctx.STORE_IDENT)
          db.createObjectStore(ctx.STORE_IDENT)
          //store.createIndex("expires", "expires", {unique: false});
        }
      },
    })
  }

  compactDb(): Promise<any> {
    return Promise.resolve(undefined)
  }

  getRequest(tabId: string): Promise<RequestInfo> {
    return this.db.get('requests', tabId)
  }

  async saveRequest(requestInfo: RequestInfo): Promise<any> {
    return await this.db.put(this.STORE_IDENT, requestInfo, requestInfo.id)
    // return this.db.put('requests', {
    //   expires: new Date().getTime() + 1000 * 60 * EXPIRE_DATA_PERIOD_IN_MINUTES,
    //   url: url,
    //   requestInfo
    // }, encodedTabUrl)
    //   .then(() => {
    //     console.debug("added request", requestInfo)
    //     if (requestInfo.statusCode.toString().startsWith("30") && requestInfo.headers.length > 0) {
    //       const suggestionId = uid()
    //       const suggestion = new Suggestion(suggestionId,
    //         "Tab URL changed", "A tab's URL has changed according to the server. Should the url be updated?",
    //         "/suggestions/" + suggestionId,
    //         SuggestionType.REDIRECT_HAPPENED_FOR_BOOKMARK)
    //       let location = undefined
    //       requestInfo.headers.forEach(headerObject => {
    //         //console.log("checking", headerObject.name.toLowerCase())
    //         if (headerObject.name.toLowerCase() === 'location') {
    //           location = headerObject.value
    //         }
    //       })
    //       console.log("location", location)
    //       if (location) {
    //         suggestion.setData({
    //           url,
    //           status: requestInfo.statusCode,
    //           location
    //         })
    //         useSuggestionsStore().addSuggestion(suggestion).catch((err) => {
    //           console.log("got error", err)
    //         })
    //       }
    //     }
    //   })
    //   .catch(err => console.log("err", err))
  }
}

export default new IndexedDbRequestPersistence()
