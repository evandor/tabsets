import Persistence from 'src/core/persistence/Persistence'

abstract class ThumbnailsPersistence implements Persistence {
  getServiceName(): string {
    return this.constructor.name
  }

  abstract init(): Promise<any>

  abstract saveThumbnail(tabId: string, tabsetId: string, thumbnail: string): Promise<void>

  abstract getThumbnail(tabId: string, userId: string): Promise<string>

  abstract deleteThumbnail(tabId: string): Promise<void>
  //abstract cleanUpThumbnails(fnc: (url: string) => boolean):Promise<void>

  compactDb(): Promise<any> {
    return Promise.resolve('noOp')
  }
}

export default ThumbnailsPersistence
