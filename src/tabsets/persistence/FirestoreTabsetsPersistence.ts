import { APP_INSTALLATION_ID } from 'boot/constants'
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  DocumentReference,
  Firestore,
  getDoc,
  getDocs,
  QuerySnapshot,
  setDoc,
} from 'firebase/firestore'
import { LocalStorage, uid } from 'quasar'
import FirebaseServices from 'src/services/firebase/FirebaseServices'
import { useEmailTemplates } from 'src/tabsets/emails/EmailTemplates'
import { Tab } from 'src/tabsets/models/Tab'
import { AugmentedData, Tabset, TabsetSharing } from 'src/tabsets/models/Tabset'
import TabsetsPersistence from 'src/tabsets/persistence/TabsetsPersistence'
import { useTabsetsStore } from 'src/tabsets/stores/tabsetsStore'
import { useUiStore } from 'src/ui/stores/uiStore'
import { useAuthStore } from 'stores/authStore'

const STORE_IDENT = 'tabsets'

const installationId = (LocalStorage.getItem(APP_INSTALLATION_ID) as string) || '---'

function tabsetDoc(tabsetId: string) {
  return doc(FirebaseServices.getFirestore(), 'users', useAuthStore().user.uid, STORE_IDENT, tabsetId)
}

function publicTabsetDoc(sharedId: string, sharedBy: string) {
  return doc(FirebaseServices.getFirestore(), 'users', sharedBy, 'tabsets', sharedId)
}

function tabsetsCollection() {
  return collection(FirebaseServices.getFirestore(), 'users', useAuthStore().user.uid, STORE_IDENT)
}

function publicTabsetsCollection() {
  return collection(FirebaseServices.getFirestore(), 'public-tabsets')
}

function publicTabsetsDoc(docId: string) {
  return doc(FirebaseServices.getFirestore(), 'public-tabsets', docId)
}

class FirestoreTabsetsPersistence implements TabsetsPersistence {
  getServiceName(): string {
    return 'FirestoreTabsetsPersistence'
  }

  async init() {
    // console.debug(` ...initialized Tabsets: ${this.getServiceName()}`, '✅')
    //this.indexedDB = useDB(undefined).db as typeof IndexedDbPersistenceService
    return Promise.resolve('')
  }

  compactDb(): Promise<any> {
    return Promise.resolve(undefined)
  }

  async loadTabsets(): Promise<any> {
    const isAnonymous = useAuthStore().user?.isAnonymous
    console.log(' ...loading tabsets', this.getServiceName(), isAnonymous)
    let docs: QuerySnapshot
    if (isAnonymous) {
      const publicTabsetsRefs = await getDocs(publicTabsetsCollection())
      for (const d of publicTabsetsRefs.docs) {
        const doc = d.data()
        //console.log('doc', doc)
        const publicTS = await this.loadPublicTabset(doc.tabsetId, doc.sharedBy)
        //console.log('loaded', publicTS, doc)
        publicTS.loaded = new Date().getTime()
        useTabsetsStore().setTabset(publicTS)
      }
    } else {
      docs = await getDocs(tabsetsCollection())
      for (const doc of docs.docs) {
        let newItem = doc.data()
        newItem.id = doc.id

        if (newItem['reference']) {
          await this.loadFromReference(newItem as { reference: DocumentReference; readonly: boolean; sharedAt: number })
        } else {
          newItem.loaded = new Date().getTime()
          useTabsetsStore().setTabset(newItem as Tabset)
        }
      }
    }

    console.log('loading tabsets, found ', useTabsetsStore().tabsets.size)
    // useUiStore().syncing = false
    return Promise.resolve(undefined)
  }

  async addTabset(tabset: Tabset): Promise<any> {
    // useUiStore().syncing = true
    // tabset.origin = this.installationId
    console.log(`saving tabset ${tabset.id} in installation {this.installationId}`)
    await setDoc(tabsetDoc(tabset.id), JSON.parse(JSON.stringify(tabset)))
    // useUiStore().syncing = false
  }

  migrate(): any {
    // no op for firestore
  }

  async saveTabset(tabset: Tabset): Promise<any> {
    //useUiStore().syncing = true
    tabset.origin = installationId
    tabset.augmentedData = new AugmentedData()
    // console.log(`saving tabset ${tabset.id} in installation ${installationId}, ref:${tabset.sharing?.shareReference}`)
    if (tabset.sharing?.shareReference) {
      tabset.lastChangeBy = useAuthStore().user.uid
      await setDoc(
        doc(FirebaseServices.getFirestore(), tabset.sharing?.shareReference),
        JSON.parse(JSON.stringify(tabset)),
      )
    } else {
      await setDoc(tabsetDoc(tabset.id), JSON.parse(JSON.stringify(tabset)))
    }
  }

  async deleteTabset(tabsetId: string): Promise<any> {
    //useUiStore().syncing = true
    await deleteDoc(tabsetDoc(tabsetId))
    //useUiStore().syncing = false
  }

  clear(name: string): void {}

  async share(
    ts: Tabset,
    sharingType: TabsetSharing,
    sharedId: string | undefined,
    sharedBy: string | undefined,
  ): Promise<TabsetSharing | void> {
    console.log(`setting property 'sharing' to ${sharingType} for tabset  ${ts.id} with sharedId ${sharedId}`, ts)
    // const ts = getTabset(tabsetId) ?? throwIdNotFound("tabset", tabsetId)
    // if (new Date().getTime() != 0) {
    //   return
    // }
    const firestore: Firestore = FirebaseServices.getFirestore()

    ts.sharing.sharing = sharingType
    ts.sharing.sharedBy = sharedBy
    ts.view = 'list'

    if (sharingType === TabsetSharing.UNSHARED) {
      console.log('deleting share for tabset', ts.sharing?.sharedId)
      if (sharedId) {
        //await deleteDoc(doc(firestore, 'public-tabsets', sharedId))
        ts.sharing.sharedBy = undefined
        ts.sharing.sharedById = undefined
        ts.sharing.sharedId = undefined
        await this.saveTabset(ts)
      }
      return
    }

    console.log('setting author and avatar for comments')
    for (const tab of ts.tabs) {
      for (const c of tab.comments) {
        console.log('found comment', c.author, c)
        if (c.author === '<me>') {
          c.author = useUiStore().sharingAuthor || '---'
          c.authorEmail = useAuthStore().user.email || undefined
        }
      }
    }

    // console.log('setting thumbnails as images')
    // for (const tab of ts.tabs) {
    //   try {
    //     const thumb = await useThumbnailsService().getThumbnailFor(tab.id, useAuthStore().user.uid)
    //     console.log(`got thumbnail for ${tab.id} (user ${useAuthStore().user.uid}): ${thumb}`)
    //     if (thumb) {
    //       tab.image = thumb
    //     }
    //   } catch (e) {}
    // }

    try {
      if (sharedId) {
        ts.sharing.sharedAt = new Date().getTime()
        console.log('updating with ts', ts)
        await setDoc(doc(firestore, 'public-tabsets', sharedId), JSON.parse(JSON.stringify(ts)))
        await this.saveTabset(ts)
        return
      } else {
        ts.sharing.sharedAt = new Date().getTime()

        const publicId = uid()
        console.log('setting shared id to ', publicId)

        ts.sharing.sharedId = ts.id // use the internal id (for now?)
        ts.sharing.sharedById = useAuthStore().user.uid
        await this.saveTabset(ts)

        // avoid id leakage
        //ts.id = 'publicly-shared-tabset'
        //ts.sharing?.sharedById = sha256(ts.sharing?.sharedById)
        // console.log('adding to public-tabsets', publicId, ts.sharing.sharedById)
        // await setDoc(doc(firestore, 'public-tabsets', publicId), {
        //   sharedBy: ts.sharing.sharedById,
        //   sharedId: publicId,
        // })
        return
      }
    } catch (e) {
      console.error('Error adding document: ', e)
    }
  }

  async shareWith(
    ts: Tabset,
    email: string,
    readonly: boolean,
    sharedBy: string | undefined,
  ): Promise<TabsetSharing | void> {
    // https://thedailywtf.com/articles/Validating_Email_Addresses and
    // https://stackoverflow.com/questions/201323/how-can-i-validate-an-email-address-using-a-regular-expression
    const emailRegex =
      /^[-!#$%&'*+/0-9=?A-Z^_a-z{|}~](\.?[-!#$%&'*+/0-9=?A-Z^_a-z{|}~])*@[a-zA-Z](-?[a-zA-Z0-9])*(\.[a-zA-Z](-?[a-zA-Z0-9])*)+$/
    if (!emailRegex.test(email)) {
      // handleError()
      return Promise.reject('this email address does not seem valid')
    }

    const firestore: Firestore = FirebaseServices.getFirestore()
    const sharedTsRef = doc(firestore, 'users', useAuthStore().user.uid, 'tabset-shares', ts.id)
    // await updateDoc(sharedTsRef, JSON.parse(JSON.stringify(shared)))

    const key = btoa(email)
    const data: { [k: string]: any } = {}
    data[key] = {
      tabsetId: ts.id,
      tabsetName: ts.name,
      email: email,
      sharedBy: sharedBy,
      sharedById: useAuthStore().user.uid,
      status: 'pending',
      readonly: readonly,
      created: new Date().getTime(),
    }

    await setDoc(sharedTsRef, data, { merge: true })

    const tabsToShare: object[] = ts.tabs.map((t: Tab) => {
      return { url: t.url || '' }
    })

    const invitationEmail = useEmailTemplates().invitationSetup(email, ts.name, sharedBy || 'unknown', tabsToShare)
    //console.log('about to add', invitationEmail)
    await addDoc(collection(firestore, 'emails'), JSON.parse(JSON.stringify(invitationEmail)))
    ts.sharing.sharing = TabsetSharing.USER
    ts.sharing.sharedBy = useAuthStore().user.email || undefined
    await useTabsetsStore().saveTabset(ts)
  }

  async loadPublicTabset(sharedId: string, sharedBy: string | undefined = undefined): Promise<Tabset> {
    if (!sharedBy) {
      const sharedData = await getDoc(publicTabsetsDoc(sharedId))
      if (sharedData.data()) {
        const sBy = sharedData.data()!['sharedBy']
        return (await getDoc(publicTabsetDoc(sharedId, sBy))).data() as Tabset
      }
    }
    const res = await getDoc(publicTabsetDoc(sharedId, sharedBy!))
    return res.data() as Tabset
  }

  async reloadTabset(tabsetId: string): Promise<Tabset> {
    console.debug('reloading tabset', tabsetId)
    const res = await getDoc(tabsetDoc(tabsetId))
    if (res.data() && res.data()!['reference']) {
      return this.loadFromReference(res.data() as { reference: DocumentReference; readonly: boolean; sharedAt: number })
    }
    return res.data() as Tabset
  }

  private async loadFromReference(r: { reference: DocumentReference; readonly: boolean; sharedAt: number }) {
    //console.warn('found ref', r)
    //console.log('r', r.path)
    const refDoc = await getDoc(r.reference)
    const referencedTabset = refDoc.data() as Tabset
    referencedTabset.sharing.shareReference = r.reference.path
    referencedTabset.sharing.sharedById = r.reference.path.split('/')[1]
    referencedTabset.loaded = new Date().getTime()
    if (!referencedTabset.augmentedData) {
      referencedTabset.augmentedData = new AugmentedData()
    }
    referencedTabset.augmentedData.sharedAt = r.sharedAt || 0
    referencedTabset.augmentedData.readonly = r.readonly
    //console.log('referencedTabset:', referencedTabset)
    useTabsetsStore().setTabset(referencedTabset)
    return referencedTabset
  }
}

export default new FirestoreTabsetsPersistence()
