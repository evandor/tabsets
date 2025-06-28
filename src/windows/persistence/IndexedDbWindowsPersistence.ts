import { IDBPDatabase, openDB } from 'idb'
// import { useUiStore } from 'src/ui/stores/uiStore'
import { Window } from 'src/windows/models/Window'

class IndexedDbWindowsPersistence {
  private STORE_IDENT = 'windows'

  private db: IDBPDatabase = null as unknown as IDBPDatabase

  getServiceName() {
    return this.constructor.name
  }

  async init() {
    this.db = await this.initDatabase()
    // useUiStore().dbReady = true
    return Promise.resolve('')
  }

  async deleteDatabase(dbName: string) {
    // useUiStore().dbReady = false
    console.warn(' ...deleting indexeddb database: not implemented', dbName)
  }

  private async initDatabase(): Promise<IDBPDatabase> {
    //console.debug(' ...about to initialize indexedDB (Windows)')
    const ctx = this
    return await openDB('windowsDB', 1, {
      // upgrading see https://stackoverflow.com/questions/50193906/create-index-on-already-existing-objectstore
      upgrade(db) {
        if (!db.objectStoreNames.contains(ctx.STORE_IDENT)) {
          console.log(`creating db ${ctx.STORE_IDENT}`)
          db.createObjectStore(ctx.STORE_IDENT)
        }
      },
    })
  }

  async addWindow(window: Window): Promise<any> {
    //console.log(`!!!adding ${window.toString()}`)
    if (!this.db) {
      return Promise.resolve('db for adding window not ready yet...')
    }
    if (window.hostList.length === 0) {
      console.warn('not adding window due to empty host list', window)
      return Promise.resolve('not adding')
    }

    const existingDbWindowForWindowId: Window | undefined = await this.db.get(this.STORE_IDENT, window.id)
    if (existingDbWindowForWindowId) {
      return this.handleExistingWindowForWindowId(window, existingDbWindowForWindowId)
    }

    // ok, no matching window id, let's try to find matching window by other means
    const allDbWindows: Window[] = (await this.db.getAll(this.STORE_IDENT)) as Window[]
    //console.log('allWindows', allWindows)
    // console.debug(
    //   `adding ${window.toString()} to list [${_.join(
    //     _.map(allDbWindows, (w: Window) => w.id),
    //     ',',
    //   )}]`,
    // )

    //}
    try {
      await this.db.add(this.STORE_IDENT, window, window.id)
    } catch (err: any) {
      if (!err.toString().indexOf('Key already exists')) {
        console.log('error adding window', window, err)
      }
    }
  }

  getWindows(): Promise<Window[]> {
    return this.db.getAll(this.STORE_IDENT)
  }

  getWindow(windowId: number): Promise<Window | undefined> {
    //console.log("trying to get window with id", windowId)
    return this.db.get(this.STORE_IDENT, windowId)
  }

  async removeWindow(windowId: number): Promise<void> {
    console.log('removing window', windowId)
    return this.db.delete(this.STORE_IDENT, windowId)
  }

  async updateWindow(window: Window): Promise<void> {
    // console.debug(
    //   `updating window id=${window.id}, title=${window.title}, index=${window.index}, #hostList=${window.hostList?.length}, size: ${window.browserWindow?.width}x${window.browserWindow?.height}`,
    // )
    //console.log(`updating: ${window.toString()}`)
    if (!window.id) {
      return Promise.reject('window.id not set')
    }
    const windowFromDb: Window = await this.db.get(this.STORE_IDENT, window.id)
    if (!windowFromDb) {
      return Promise.reject('could not find window for id ' + window.id)
    }
    const asJson = JSON.parse(JSON.stringify(window))

    asJson['title'] = window.title
    asJson['index'] = window.index
    asJson['hostList'] = window.hostList ? Array.from(window.hostList) : []

    delete asJson['tabs']
    //console.debug("saving window json as ", asJson)
    await this.db.put(this.STORE_IDENT, asJson, window.id)
  }

  async upsertWindow(window: Window): Promise<void> {
    try {
      //console.log(`!!!upsertWindow:  ${window.toLocaleString()}`)
      const asJson = JSON.parse(JSON.stringify(window))
      delete asJson['tabs']
      await this.db.put(this.STORE_IDENT, asJson, window.id)
    } catch (err) {
      console.log('error renaming window', err)
    }
  }

  async migrate() {
    // 0.4.11 - 0.5.0
    // done
  }

  clear(name: string) {
    this.db.clear(name).catch((e) => console.warn(e))
  }

  private handleExistingWindowForWindowId(window: Window, existingWindowForWindowId: Window) {
    const mergedWindow = new Window(
      window.id,
      window.browserWindow,
      existingWindowForWindowId.title,
      existingWindowForWindowId.index,
      existingWindowForWindowId.open,
      window.hostList,
    )
    //console.debug(`existing windowId, merging to ${mergedWindow.toString()}`)
    this.db
      .put(this.STORE_IDENT, JSON.parse(JSON.stringify(mergedWindow)), window.id)
      .catch((err) => console.error('error', err))
    return Promise.resolve('not added, updated hostList instead')
  }

  deleteWindow(windowId: any) {
    return this.db.delete(this.STORE_IDENT, windowId)
  }
}

export default new IndexedDbWindowsPersistence()
