import { collection, deleteDoc, doc, getDocs, setDoc } from 'firebase/firestore'
import { uid } from 'quasar'
import FeaturesPersistence from 'src/features/persistence/FeaturesPersistence'
import FirebaseServices from 'src/services/firebase/FirebaseServices'
import { useAuthStore } from 'stores/authStore'

const STORE_IDENT = 'features'

function featureDoc(id: string) {
  return doc(FirebaseServices.getFirestore(), 'users', useAuthStore().user.uid, STORE_IDENT, id)
}

function featuresCollection() {
  return collection(FirebaseServices.getFirestore(), 'users', useAuthStore().user.uid, STORE_IDENT)
}

class FirestoreFeaturesPersistence implements FeaturesPersistence {
  getServiceName(): string {
    return this.constructor.name
  }

  async init() {
    //console.debug(" ...initializing GitPersistenceService")
    //this.indexedDB = useDB(undefined).db as typeof IndexedDbPersistenceService
    return Promise.resolve('')
  }

  compactDb(): Promise<any> {
    return Promise.resolve(undefined)
  }

  migrate(): any {
    // no op for firestore
  }

  clear(name: string): void {}

  async getActiveFeatures(): Promise<string[]> {
    if (!useAuthStore().user) {
      return Promise.resolve([]) // user not authenticated
    }
    // collection(FirebaseServices.getFirestore(), "users", useAuthStore().user.uid, STORE_IDENT)
    const docs = await getDocs(featuresCollection())
    // console.log('docs', docs)

    const res: string[] = []
    docs.forEach((doc) => {
      // doc.data() is never undefined for query doc snapshots
      //console.log(doc.id, " => ", doc.data())
      res.push(doc.data()['feature'])
    })
    return Promise.resolve(res)
  }

  async saveActiveFeatures(activeFeatures: string[]) {
    const docs = await getDocs(featuresCollection())
    //_.map(docs, (doc: any) => doc.data() as string)
    // eslint-disable-next-line @typescript-eslint/no-misused-promises
    docs.forEach(async (doc: any) => {
      console.log('deleting document', doc)
      await deleteDoc(featureDoc(doc.id))
    })
    activeFeatures.forEach((feature: string) => {
      setDoc(featureDoc(uid()), { feature })
    })
  }
}

export default new FirestoreFeaturesPersistence()
