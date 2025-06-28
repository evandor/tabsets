import { uid } from 'quasar'
import backendApi from 'src/services/BackendApi'
import { Annotation } from 'src/snapshots/models/Annotation'
import { BlobMetadata } from 'src/snapshots/models/BlobMetadata'
import { useSnapshotsStore } from 'src/snapshots/stores/SnapshotsStore'

export function useSnapshotsService() {
  const init = async () => {
    // console.debug(' ...initialized snapshots: Service', '✅')
  }

  const convertFrom = (html: string) => {
    return backendApi.createPdf(html)
  }

  const warcFrom = (html: string) => {
    //return backendApi.createWarc(html)
    throw new Error('not implemented H')
  }

  const saveHTML = async (id: string, url: string, html: string, remark: string | undefined = undefined) => {
    await useSnapshotsStore().saveHTML(id, url, html, remark)
  }

  const saveEditedHTML = async (id: string, url: string, html: string, remark: string | undefined = undefined) => {
    await useSnapshotsStore().saveEditedHTML(id, url, html, remark)
  }

  const savePng = async (id: string, url: string, img: Blob, remark: string | undefined = undefined) => {
    return await useSnapshotsStore().savePng(id, url, img, remark)
  }

  const savePdf = async (id: string, url: string, img: Blob, remark: string | undefined = undefined) => {
    return await useSnapshotsStore().savePdf(id, url, img, remark)
  }

  const saveWarc = async (id: string, url: string, img: Blob, remark: string | undefined = undefined) => {
    return await useSnapshotsStore().saveWarc(id, url, img, remark)
  }

  const getMetadataFor = (sourceId: string): Promise<BlobMetadata[]> => {
    return useSnapshotsStore().metadataFor(sourceId)
  }

  const getMetadataById = (id: string): Promise<BlobMetadata | undefined> => {
    console.log('getMetadataById', id)
    return useSnapshotsStore().metadataById(id)
  }

  const getBlobFor = (id: string): Promise<Blob | undefined> => {
    return useSnapshotsStore().blobFor(id)
  }

  const screenshotFrom = (html: string) => {
    return backendApi.createPng(html)
  }

  const pdfFrom = (html: string) => {
    return backendApi.createPdf(html)
  }

  const deleteBlob = (tabId: string, elementId: string) => {
    //useSnapshotsStore().deleteBlob(tabId, elementId)
  }

  const createAnnotation = (
    snapshotId: string,
    selection: any,
    text: string | undefined,
    rect: object,
    viewport: object,
    title: string,
    comment: string | undefined,
    color: string = 'grey',
  ): Promise<Annotation[]> => {
    console.log('createAnnotation', snapshotId, selection, text, rect, viewport, comment)
    const annotation = new Annotation(uid(), selection, text, rect, viewport, title, comment, color)
    return useSnapshotsStore().createAnnotation(snapshotId, annotation)
  }

  const updateAnnotation = (tabId: string, annotation: Annotation, index: number): Promise<Annotation[]> => {
    console.log('updateAnnotation', tabId, index, annotation, index)
    return useSnapshotsStore().updateAnnotation(tabId, index, annotation)
  }

  const deleteAnnotation = (metadataId: string, a: Annotation, i: number): Promise<Annotation[]> => {
    return useSnapshotsStore().deleteAnnotation(metadataId, a)
  }

  const deleteSnapshot = (snapshotId: string) => {
    return useSnapshotsStore().deleteMetadataForSource(snapshotId)
  }

  return {
    init,
    convertFrom,
    saveHTML,
    saveEditedHTML,
    savePng,
    savePdf,
    screenshotFrom,
    pdfFrom,
    getMetadataFor,
    getMetadataById,
    deleteBlob,
    getBlobFor,
    createAnnotation,
    updateAnnotation,
    deleteAnnotation,
    deleteSnapshot,
    warcFrom,
    saveWarc,
  }
}
