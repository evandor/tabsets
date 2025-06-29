import { doc, setDoc } from 'firebase/firestore'
import { deleteObject, getBytes, getMetadata, listAll, ref, StringFormat, uploadString } from 'firebase/storage'
import FirebaseServices from 'src/services/firebase/FirebaseServices'
import ThumbnailsPersistence from 'src/thumbnails/persistence/ThumbnailsPersistence'
import { useAuthStore } from 'stores/authStore'

class FirestoreThumbnailsPersistence extends ThumbnailsPersistence {
  async init() {
    // console.debug(` ...initialized thumbnails: ${this.getServiceName()}`, '✅')
    return Promise.resolve('')
  }

  saveThumbnail(tabId: string, tabsetId: string, thumbnail: string): Promise<void> {
    console.log(`saving Thumbnail ${tabId}`)
    this.saveBlobToStorage(tabId, tabsetId, thumbnail)
    this.updateStorageQuote().catch((err) => console.warn('error with updateStorageQuote', err))
    return Promise.resolve()
  }

  async getThumbnail(tabId: string, userId: string): Promise<string> {
    const url = `users/${userId}/thumbnails/${tabId}`
    try {
      //console.log(`getting thumbnail for ${url}`)
      const storageReference = ref(FirebaseServices.getStorage(), url)
      const res = await getBytes(storageReference)
      const decoder = new TextDecoder('utf-8')
      return decoder.decode(res)
    } catch (err: any) {
      console.error('***', err)
      return Promise.reject(`no thumbnail found for '${url}': ${err}`)
    }
  }

  async deleteThumbnail(tabId: string): Promise<void> {
    const storageReference = ref(FirebaseServices.getStorage(), `users/${useAuthStore().user.uid}/thumbnails/${tabId}`)
    console.log(`deleting thumbnail for ${storageReference.fullPath}`)
    await deleteObject(storageReference)
    await this.updateStorageQuote()
    return Promise.resolve()
  }

  private saveBlobToStorage(tabId: string, tabsetId: string, data: string) {
    const metadata: any = {
      contentType: 'application/octet-stream',
      customMetadata: {
        tabsetId: tabsetId,
      },
    }
    console.log('metadata', metadata)
    const storageReference = ref(FirebaseServices.getStorage(), `users/${useAuthStore().user.uid}/thumbnails/${tabId}`)
    // console.log('storageReference', storageReference, data)
    uploadString(storageReference, data, StringFormat.RAW, metadata)
      .then(() => console.log(`uploaded thumbnail, length ${data.length}`))
      .catch((err: any) => {
        console.warn('Uploaded thumbnail error', err)
      })
    return tabId
  }

  private async saveQuote(quote: object) {
    if (useAuthStore().user?.uid) {
      const userDoc = doc(FirebaseServices.getFirestore(), 'users', useAuthStore().user.uid)
      //console.log('userDoc', userDoc, useAuthStore().user?.uid)
      await setDoc(userDoc, quote, { merge: true })
    }
  }

  private async updateStorageQuote() {
    const userThumnnails = ref(FirebaseServices.getStorage(), `users/${useAuthStore().user.uid}/thumbnails`)
    const res = await listAll(userThumnnails)
    let size = 0
    for (const itemRef of res.items) {
      try {
        const md = await getMetadata(itemRef)
        size += md.size
      } catch (err) {
        // ignore, document might have been deleted
      }
    }
    //console.log('size', size)
    await this.saveQuote({ thumbnails: Math.round((100 * size) / (1024 * 1024)) / 100 })
  }
}

export default new FirestoreThumbnailsPersistence()
