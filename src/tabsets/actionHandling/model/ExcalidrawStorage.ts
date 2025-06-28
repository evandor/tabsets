export class ExcalidrawStorage {
  constructor(
    public excalidraw: any,
    public excalidrawState = {},
    public versionFiles = 0,
    public versionDataState = 0,
  ) {}
}
