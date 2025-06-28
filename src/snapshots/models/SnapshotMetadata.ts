import { BlobMetadata } from 'src/snapshots/models/BlobMetadata'

export class SnapshotMetadata {
  constructor(
    public mhtmls: BlobMetadata[],
    public pngs: BlobMetadata[],
  ) {}
}
