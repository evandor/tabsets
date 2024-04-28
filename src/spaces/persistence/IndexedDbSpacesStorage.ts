import {IDBPDatabase, openDB, deleteDB} from "idb";
import _ from "lodash";
import SpacesPersistence from "src/spaces/persistence/SpacesPersistence";
import {Space} from "src/spaces/models/Space";
import {useSpacesStore} from "src/spaces/stores/spacesStore";

class IndexedDbSpacesStorage implements SpacesPersistence {

  private STORE_IDENT = 'spaces';

  private db: IDBPDatabase = null as unknown as IDBPDatabase

  getServiceName(): string {
    return "IndexedDbSpacesStorage";
  }

  async init() {
    console.log(" ...initializing spaces (IndexedDbSpacesStorage)" )
    this.db = await this.initDatabase()
    return Promise.resolve()
  }

  private async initDatabase(): Promise<IDBPDatabase> {
    console.debug(" about to initialize indexedDB")
    const ctx = this
    return await openDB("spacesDB", 1, {
      // upgrading see https://stackoverflow.com/questions/50193906/create-index-on-already-existing-objectstore
      upgrade(db) {
        if (!db.objectStoreNames.contains(ctx.STORE_IDENT)) {
          console.log("creating db " + ctx.STORE_IDENT)
          db.createObjectStore(ctx.STORE_IDENT);
        }
      }
    });
  }

  async addSpace(space: Space): Promise<any> {
    return await this.db.put(this.STORE_IDENT, space, space.id)
      .then(() => Promise.resolve())
  }

  compactDb(): Promise<any> {
    return Promise.resolve(undefined);
  }

  async deleteSpace(spaceId: string) {
    return this.db.delete(this.STORE_IDENT, spaceId)
  }

  async loadSpaces(): Promise<any> {
    console.debug(" loading spaces...")
    const spacesStore = useSpacesStore()
    const keys: IDBValidKey[] = await this.db.getAllKeys(this.STORE_IDENT)
    _.forEach(keys, key => {
      this.db.get(this.STORE_IDENT, key)
        .then((space: Space) => {
          spacesStore.putSpace(space)
        })
        .catch(err => console.log("err", err))
    })
  }

  async migrate() {
    // 0.4.11 - 0.5.0
    const oldDB = await openDB("db")
    const oldSpaces = await oldDB.getAll('spaces')
    for(const oldSpace of oldSpaces) {
      const optionalSpaceInNewDb = await this.db.get(this.STORE_IDENT, oldSpace.id) as Space | undefined
      if (!optionalSpaceInNewDb) {
        console.log("migrating old space", oldSpace.id, oldSpace.name)
        await this.db.add(this.STORE_IDENT, oldSpace, oldSpace.id)
      }
    }
  }



}

export default new IndexedDbSpacesStorage()
