import { collection, deleteDoc, doc, getDocs, setDoc } from 'firebase/firestore'
import { LocalStorage } from 'quasar'
import FirebaseServices from 'src/services/firebase/FirebaseServices'
import { Space } from 'src/spaces/models/Space'
import SpacesPersistence from 'src/spaces/persistence/SpacesPersistence'
import { useSpacesStore } from 'src/spaces/stores/spacesStore'
import { useUiStore } from 'src/ui/stores/uiStore'
import { useAuthStore } from 'stores/authStore'

const STORE_IDENT = 'spaces'

function spaceDoc(spaceId: string) {
  return doc(FirebaseServices.getFirestore(), 'users', useAuthStore().user.uid, STORE_IDENT, spaceId)
}

function spacesCollection() {
  return collection(FirebaseServices.getFirestore(), 'users', useAuthStore().user.uid, STORE_IDENT)
}

class FirestoreSpacesPersistence implements SpacesPersistence {
  getServiceName(): string {
    return this.constructor.name
  }

  async init() {
    // console.debug(` ...initialized spaces: ${this.getServiceName()}`, '✅')
    return Promise.resolve('')
  }

  async loadSpaces(): Promise<any> {
    if (!useAuthStore().user) {
      return Promise.resolve([]) // user not authenticated
    }
    useUiStore().syncing = true
    LocalStorage.set('ui.spaces.lastUpdate', new Date().getTime())
    ;(await getDocs(spacesCollection())).forEach((doc) => {
      let newItem = doc.data() as Space
      newItem.id = doc.id
      useSpacesStore().addSpace(newItem)
    })
    useUiStore().syncing = false
    return Promise.resolve(undefined)
  }

  async addSpace(entity: Space): Promise<any> {
    useUiStore().syncing = true
    await setDoc(spaceDoc(entity.id), JSON.parse(JSON.stringify(entity)))
    useUiStore().syncing = false
  }

  // eslint-disable-next-line @typescript-eslint/no-misused-promises
  async deleteSpace(entityId: string) {
    useUiStore().syncing = true
    await deleteDoc(spaceDoc(entityId))
    useUiStore().syncing = false
  }

  compactDb(): Promise<any> {
    return Promise.resolve(undefined)
  }

  migrate(): any {
    // no op
  }

  clear(name: string): void {}
}

export default new FirestoreSpacesPersistence()
