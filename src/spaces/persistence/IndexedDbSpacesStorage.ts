import {IDBPDatabase, openDB, deleteDB} from "idb";
import _ from "lodash";
import {useUiStore} from "src/stores/uiStore";
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

  addSpace(space: Space): Promise<any> {
    return Promise.resolve(undefined);
  }

  compactDb(): Promise<any> {
    return Promise.resolve(undefined);
  }

  deleteSpace(spaceId: string): void {
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


}

export default new IndexedDbSpacesStorage()
