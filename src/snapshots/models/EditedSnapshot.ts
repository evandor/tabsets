export class EditedSnapshot {
  constructor(
    public snapshotId: string,
    public sourceId: string,
    public url: string,
    public html: string,
  ) {}
}
