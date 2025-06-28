import { defineStore } from 'pinia'
import { Annotation } from 'src/snapshots/models/Annotation'
import { BlobMetadata, BlobType } from 'src/snapshots/models/BlobMetadata'
import SnapshotsPersistence from 'src/snapshots/persistence/SnapshotsPersistence'
import { ref } from 'vue'

export const useSnapshotsStore = defineStore('snapshots', () => {
  let storage: SnapshotsPersistence = null as unknown as SnapshotsPersistence

  const metadata = ref<BlobMetadata[]>([])

  const lastUpdate = ref(0)

  async function initialize(ps: SnapshotsPersistence) {
    storage = ps
    await storage.init()
    metadata.value = await storage.getMetadata()
    lastUpdate.value = new Date().getTime()
    // console.debug(' ...initialized snapshots: Store', '✅')
  }

  const saveHTML = async (
    id: string,
    url: string,
    html: string,
    remark: string | undefined = undefined,
  ): Promise<any> => {
    const res = await storage.saveBlob(
      id,
      url,
      new Blob([html], {
        type: 'text/html',
      }),
      BlobType.HTML,
      remark,
    )
    lastUpdate.value = new Date().getTime()
    return res
  }

  const saveEditedHTML = async (
    id: string,
    url: string,
    html: string,
    remark: string | undefined = undefined,
  ): Promise<any> => {
    const res = await storage.saveBlob(
      id,
      url,
      new Blob([html], {
        type: 'text/html',
      }),
      BlobType.EditedHTML,
      remark,
    )
    lastUpdate.value = new Date().getTime()
    return res
  }

  const saveMHtml = async (
    id: string,
    url: string,
    mhtml: Blob,
    remark: string | undefined = undefined,
  ): Promise<string> => {
    const res = await storage.saveBlob(id, url, mhtml, BlobType.MHTML, remark)
    lastUpdate.value = new Date().getTime()
    return res
  }

  const savePng = async (id: string, url: string, img: Blob, remark: string | undefined = undefined): Promise<any> => {
    const res = storage.saveBlob(id, url, img, BlobType.PNG, remark)
    lastUpdate.value = new Date().getTime()
    return res
  }

  const savePdf = async (id: string, url: string, img: Blob, remark: string | undefined = undefined): Promise<any> => {
    const res = storage.saveBlob(id, url, img, BlobType.PDF, remark)
    lastUpdate.value = new Date().getTime()
    return res
  }

  const saveWarc = async (id: string, url: string, img: Blob, remark: string | undefined = undefined): Promise<any> => {
    const res = storage.saveBlob(id, url, img, BlobType.WARC, remark)
    lastUpdate.value = new Date().getTime()
    return res
  }

  const metadataFor = (sourceId: string): Promise<BlobMetadata[]> => {
    if (storage) {
      return storage.getMetadataFor(sourceId)
    }
    return Promise.resolve([])
  }

  const metadataById = (id: string): Promise<BlobMetadata | undefined> => {
    return storage.getMetadataById(id)
  }

  const blobFor = (id: string): Promise<Blob | undefined> => {
    return storage.getBlobFor(id)
  }

  const deleteBlob = async (blobId: string) => {
    console.log('deleting blob', blobId)
    await storage.deleteBlob(blobId)
    lastUpdate.value = new Date().getTime()
  }

  const createAnnotation = async (snapshotId: string, annotation: Annotation): Promise<Annotation[]> => {
    return await storage.addAnnotation(snapshotId, annotation)
  }

  const updateAnnotation = async (tabId: string, index: number, annotation: Annotation): Promise<Annotation[]> => {
    return await storage.updateAnnotation(tabId, index, annotation)
  }

  const deleteAnnotation = async (metadataId: string, toDelete: Annotation): Promise<Annotation[]> => {
    return storage.deleteAnnotation(metadataId, toDelete)
  }

  const deleteMetadataForSource = async (snapshotId: string) => {
    await storage.deleteMetadataForSource(snapshotId)
    lastUpdate.value = new Date().getTime()
  }

  return {
    initialize,
    lastUpdate,
    metadata,
    saveHTML,
    saveEditedHTML,
    saveMHtml,
    savePng,
    savePdf,
    metadataFor,
    metadataById,
    blobFor,
    deleteBlob,
    createAnnotation,
    updateAnnotation,
    deleteAnnotation,
    deleteMetadataForSource,
    saveWarc,
  }
})
