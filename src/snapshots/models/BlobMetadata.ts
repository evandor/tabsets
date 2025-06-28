import { Annotation } from 'src/snapshots/models/Annotation'

export enum BlobType {
  PNG = 'PNG',
  PDF = 'PDF',
  MHTML = 'MHTML',
  HTML = 'HTML',
  EditedHTML = 'EditedHTML',
  WARC = 'WARC',
}

export class BlobMetadata {
  created: number

  constructor(
    public id: string, // internal id
    public sourceId: string, // e.g. tab id
    public blobId: string, // the referenced blob id
    public type: BlobType,
    public url: string,
    public remark: string | undefined = undefined,
    public annotations: Annotation[] = [],
  ) {
    this.created = new Date().getTime()
  }
}
