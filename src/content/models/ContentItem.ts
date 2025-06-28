import { v5 as uuidv5 } from 'uuid'

export class ContentItem {
  created: number
  public contentHash: string = ''

  constructor(
    public id: string,
    public title: string,
    public url: string,
    public content: string,
    public metas: object,
    public tabsetIds: string[],
  ) {
    this.created = new Date().getTime()
    this.contentHash = uuidv5(content, 'da42d8e8-2afd-446f-b72e-8b437aa03e46')
  }

  setContentHash(hash: string) {
    this.contentHash = hash
  }
}
