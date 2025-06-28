import { ContentItem } from 'src/content/models/ContentItem'

interface ContentPersistence {
  getServiceName(): string

  init(): Promise<any>

  getContent(tabId: string): Promise<ContentItem | undefined>

  deleteContent(tabId: string): Promise<void>

  saveContent(tabId: string, contentItem: ContentItem): Promise<any>

  cleanUpContent(fnc: (tabId: string) => boolean): Promise<object[]>

  getContentFor(url: string): Promise<ContentItem | undefined>

  getContents(): Promise<ContentItem[]>

  compactDb(): Promise<any>
}

export default ContentPersistence
