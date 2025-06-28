import { IDBPDatabase, openDB } from 'idb'
import _ from 'lodash'
import { uid } from 'quasar'
import { Annotation } from 'src/snapshots/models/Annotation'
import { BlobMetadata, BlobType } from 'src/snapshots/models/BlobMetadata'
import SnapshotsPersistence from 'src/snapshots/persistence/SnapshotsPersistence'

class IndexedDbSnapshotsPersistence implements SnapshotsPersistence {
  private db: IDBPDatabase = null as unknown as IDBPDatabase

  private BLOBS_STORE_IDENT = 'blobs'
  private META_STORE_IDENT = 'metadata'

  getServiceName(): string {
    return this.constructor.name
  }

  async init() {
    this.db = await this.initDatabase()
    // console.debug(` ...initialized snapshots: ${this.getServiceName()}`, '✅')
    return Promise.resolve()
  }

  private async initDatabase(): Promise<IDBPDatabase> {
    const ctx = this
    return await openDB('snapshotsDB', 1, {
      upgrade(db) {
        if (!db.objectStoreNames.contains(ctx.BLOBS_STORE_IDENT)) {
          console.log('creating db ' + ctx.BLOBS_STORE_IDENT)
          db.createObjectStore(ctx.BLOBS_STORE_IDENT)
        }
        if (!db.objectStoreNames.contains(ctx.META_STORE_IDENT)) {
          console.log('creating db ' + ctx.META_STORE_IDENT)
          const store = db.createObjectStore(ctx.META_STORE_IDENT)
          store.createIndex('sourceId', 'sourceId', { unique: false })
        }
      },
    })
  }

  clear(name: string): void {}

  compactDb(): Promise<any> {
    return Promise.resolve(undefined)
  }

  async deleteBlob(blobId: string) {
    // let blobsForTab = await this.getBlobsForTab(tabId)
    // blobsForTab = _.filter(blobsForTab, b => b.id !== elementId)
    await this.db.delete('blobs', blobId)
  }

  async getMetadataFor(sourceId: string): Promise<BlobMetadata[]> {
    return this.db.getAllFromIndex(this.META_STORE_IDENT, 'sourceId', sourceId)
  }

  async getMetadataById(id: string): Promise<BlobMetadata | undefined> {
    return this.db.get(this.META_STORE_IDENT, id)
  }

  // actually not getting a blobMetadata array with simple "getAll", so:
  // https://stackoverflow.com/questions/47931595/indexeddb-getting-all-data-with-keys
  async getMetadata() {
    return this.db.getAll(this.META_STORE_IDENT)
    // const result: Map<string, BlobMetadata[]> = new Map()
    // const allKeys = await this.db.getAllKeys(this.META_STORE_IDENT)
    // for (const k of allKeys) {
    //   const values = await this.db.get(this.META_STORE_IDENT, k) as BlobMetadata[]
    //   result.set(k.toString(), values)
    // }
    // console.log("result", result)
    // return result;
  }

  async getBlobFor(id: string): Promise<Blob> {
    return (await this.db.get(this.BLOBS_STORE_IDENT, id)) as Blob
  }

  async addAnnotation(metadataId: string, annotation: Annotation): Promise<Annotation[]> {
    const res = (await this.db.get(this.META_STORE_IDENT, metadataId)) as BlobMetadata
    console.log(`adding annotation for ${metadataId} to `, res)
    res.annotations.push(annotation)
    await this.db.put(this.META_STORE_IDENT, JSON.parse(JSON.stringify(res)), metadataId)
    return res.annotations
  }

  async updateAnnotation(sourceId: string, index: number, annotation: Annotation): Promise<Annotation[]> {
    const res = (await this.db.get(this.META_STORE_IDENT, sourceId)) as BlobMetadata[]
    console.log('updating annotation', res, index)
    if (res[index]!.annotations) {
      const annotationIndex = _.findIndex(res[index]!.annotations, { id: annotation.id })
      if (annotationIndex >= 0) {
        res[index]!.annotations[annotationIndex] = annotation
      }
    } else {
      throw new Error('annotation not found')
    }
    await this.db.put(this.META_STORE_IDENT, JSON.parse(JSON.stringify(res)), sourceId)
    return res[index]!.annotations
  }

  async deleteAnnotation(metadataId: string, toDelete: Annotation): Promise<Annotation[]> {
    const md = await this.getMetadataById(metadataId)
    if (md) {
      md.annotations = _.filter(md.annotations, (a: Annotation) => a.id !== toDelete.id)
      await this.db.put(this.META_STORE_IDENT, md, metadataId)
      return Promise.resolve(md.annotations)
    }
    return Promise.resolve([])
  }

  async deleteMetadataForSource(snapshotId: string) {
    const snapshot = (await this.db.get(this.META_STORE_IDENT, snapshotId)) as BlobMetadata
    if (snapshot) {
      await this.db.delete(this.BLOBS_STORE_IDENT, snapshot.blobId)
    }
    return this.db.delete(this.META_STORE_IDENT, snapshotId)
  }

  /**
   * add metadata for id; push to array if already existing
   * // TODO transaction
   */
  async saveHTML(id: string, url: string, data: Blob, type: BlobType, remark: string | undefined): Promise<any> {
    // const blobId = uid()
    // await this.db.put(this.BLOBS_STORE_IDENT, data, blobId)
    // const metadata = new BlobMetadata(id, blobId, BlobType.MHTML, url, remark)
    // await this.db.put(this.META_STORE_IDENT, metadata, uid())
    return Promise.reject('not implemented G')
  }

  async saveBlob(id: string, url: string, data: Blob, type: BlobType, remark: string | undefined): Promise<string> {
    const blobId = uid()
    await this.db.put(this.BLOBS_STORE_IDENT, data, blobId)

    const mdId = uid()
    const metadata = new BlobMetadata(mdId, id, blobId, type, url, remark)
    await this.db.put(this.META_STORE_IDENT, metadata, mdId)
    return Promise.resolve(mdId)
  }

  // async savePng(id: string, url: string, data: Blob, type: BlobType, remark: string | undefined): Promise<string> {
  //   const blobId = uid()
  //   await this.db.put(this.BLOBS_STORE_IDENT, data, blobId)
  //
  //   const mdId = uid()
  //   const metadata = new BlobMetadata(mdId, id, blobId, BlobType.PNG, url, remark)
  //   await this.db.put(this.META_STORE_IDENT, metadata, mdId)
  //   return Promise.resolve(mdId)
  // }
  //
  // async savePdf(id: string, url: string, data: Blob, type: BlobType, remark: string | undefined): Promise<string> {
  //   const blobId = uid()
  //   await this.db.put(this.BLOBS_STORE_IDENT, data, blobId)
  //
  //   const mdId = uid()
  //   const metadata = new BlobMetadata(mdId, id, blobId, BlobType.PDF, url, remark)
  //   await this.db.put(this.META_STORE_IDENT, metadata, mdId)
  //   return Promise.resolve(mdId)
  // }
}

export default new IndexedDbSnapshotsPersistence()
