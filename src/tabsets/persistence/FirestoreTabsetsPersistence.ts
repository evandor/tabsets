import {useAuthStore} from "stores/authStore";
import {collection, deleteDoc, doc, getDoc, getDocs, setDoc, updateDoc} from "firebase/firestore";
import FirebaseServices from "src/services/firebase/FirebaseServices";
import IndexedDbPersistenceService from "src/services/IndexedDbPersistenceService";
import TabsetsPersistence from "src/tabsets/persistence/TabsetsPersistence";
import {Tabset} from "src/tabsets/models/Tabset";
import {useTabsetsStore} from "src/tabsets/stores/tabsetsStore";
import {LocalStorage} from "quasar";
import {APP_INSTALLATION_ID} from "boot/constants";

const STORE_IDENT = 'tabsets';

const installationId = LocalStorage.getItem(APP_INSTALLATION_ID) as string || '---'

function tabsetDoc(tabsetId: string) {
  return doc(FirebaseServices.getFirestore(), "users", useAuthStore().user.uid, STORE_IDENT, tabsetId)
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
    console.log("loading tabsets", this.getServiceName());
    // useUiStore().syncing = true
    const docs = await getDocs(tabsetsCollection())
    docs.forEach((doc:any) => {
      let newItem = doc.data() as Tabset
      newItem.id = doc.id;
      useTabsetsStore().setTabset(newItem)
    })
    console.log("loading tabsets, found ", useTabsetsStore().tabsets.size);
    // useUiStore().syncing = false
    return Promise.resolve(undefined);
  }

  addTabset(ts: Tabset): Promise<any> {
    return Promise.resolve(undefined);
  }

  migrate(): any {
    // no op for firestore
  }

  async saveTabset(tabset: Tabset): Promise<any> {
    //useUiStore().syncing = true
    tabset.origin = installationId
    console.log(`saving tabset ${tabset.id} in installation ${installationId}`)
    await setDoc(tabsetDoc(tabset.id), JSON.parse(JSON.stringify(tabset)))
    //useUiStore().syncing = false
  }

  async deleteTabset(tabsetId: string): Promise<any> {
    //useUiStore().syncing = true
    await deleteDoc(tabsetDoc(tabsetId))
    //useUiStore().syncing = false
  }

  clear(name: string): void {
  }


}

export default new FirestoreTabsetsPersistence()
