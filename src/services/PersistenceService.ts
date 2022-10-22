import {Tabset} from "src/models/Tabset";

interface PersistenceService {

  loadTabsets():Promise<void>

  saveTabset(tabset: Tabset): Promise<IDBValidKey>

  deleteTabset(tabsetId: string):Promise<void>

}

export default PersistenceService
