import { Annotation } from 'src/snapshots/models/Annotation'
import { BlobMetadata, BlobType } from 'src/snapshots/models/BlobMetadata'

interface SnapshotsPersistence {
  // --- generic ---
  getServiceName(): string
  init(): Promise<any>
  compactDb(): Promise<any>
  clear(name: string): void

  // --- creating snapshots---

  // saveHTML(id: string, url: string, data: Blob, type: BlobType, remark: string | undefined): Promise<any>
  //
  // // ok (indexeddb)
  // saveMHtml(id: string, url: string, data: Blob, remark: string | undefined): Promise<string>
  //
  // // ok (indexeddb)
  // savePng(id: string, url: string, data: Blob, type: BlobType, remark: string | undefined): Promise<string>
  //
  // // ok (indexeddb)
  // savePdf(id: string, url: string, data: Blob, type: BlobType, remark: string | undefined): Promise<string>

  saveBlob(id: string, url: string, data: Blob, type: BlobType, remark: string | undefined): Promise<string>

  // --- managing metadata ---

  getMetadataFor(sourceId: string): Promise<BlobMetadata[]>

  /**
   * tries to retrieve the metadata for given metadata id, undefined if not found.
   */
  getMetadataById(id: string): Promise<BlobMetadata | undefined>

  getMetadata(): Promise<BlobMetadata[]>

  deleteMetadataForSource(metadataId: string): Promise<void>

  // --- managing blobs ---
  getBlobFor(id: string): Promise<Blob | undefined>

  deleteBlob(blobId: string): Promise<void>

  // --- managing annotations ---

  /**
   * adds the annotation to the metadata annotations array and returns
   * the current list of annotations (including the new one)
   */
  addAnnotation(metadataId: string, annotation: Annotation): Promise<Annotation[]>

  updateAnnotation(tabId: string, index: number, annotation: Annotation): Promise<Annotation[]>

  deleteAnnotation(metadataId: string, toDelete: Annotation): Promise<Annotation[]>
}

export default SnapshotsPersistence
