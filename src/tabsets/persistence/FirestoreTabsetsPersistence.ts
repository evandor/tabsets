import {useAuthStore} from "stores/authStore";
import {collection, deleteDoc, doc, getDoc, getDocs, setDoc, updateDoc} from "firebase/firestore";
import FirebaseServices from "src/services/firebase/FirebaseServices";
import IndexedDbPersistenceService from "src/services/IndexedDbPersistenceService";
import TabsetsPersistence from "src/tabsets/persistence/TabsetsPersistence";
import {useUiStore} from "stores/uiStore";
import {Tabset} from "src/tabsets/models/Tabset";
import {useTabsStore} from "stores/tabsStore";
import {useTabsetsStore} from "src/tabsets/stores/tabsetsStore";

const STORE_IDENT = 'tabsets';

function spaceDoc(spaceId: string) {
  return doc(FirebaseServices.getFirestore(), "users", useAuthStore().user.uid, STORE_IDENT, spaceId)
}

function tabsetsCollection() {
  return collection(FirebaseServices.getFirestore(), "users", useAuthStore().user.uid, STORE_IDENT)
}

class FirestoreTabsetsPersistence implements TabsetsPersistence {

  private indexedDB: typeof IndexedDbPersistenceService = null as unknown as typeof IndexedDbPersistenceService

  getServiceName(): string {
    return "FirestoreTabsetsPersistence"
  }

  async init() {
    //console.log(" ...initializing GitPersistenceService")
    //this.indexedDB = useDB(undefined).db as typeof IndexedDbPersistenceService
    return Promise.resolve("")
  }


  compactDb(): Promise<any> {
    return Promise.resolve(undefined);
  }

  async loadTabsets(): Promise<any> {
    // useUiStore().syncing = true
    const docs = await getDocs(tabsetsCollection())
    docs.forEach((doc) => {
      let newItem = doc.data() as Tabset
      newItem.id = doc.id;
      useTabsetsStore().setTabset(newItem)
    })
    // useUiStore().syncing = false
    return Promise.resolve(undefined);
  }

  addTabset(ts: Tabset): Promise<any> {
    return Promise.resolve(undefined);
  }

  migrate(): any {
    // no op for firestore
  }

  saveTabset(ts: Tabset): Promise<any> {
    return Promise.resolve(undefined);
  }

  deleteTabset(tabsetId: string): void {
  }


}

export default new FirestoreTabsetsPersistence()
