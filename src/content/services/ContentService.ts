import AppEventDispatcher from 'src/app/AppEventDispatcher'
import { ContentItem } from 'src/content/models/ContentItem'
import ContentPersistence from 'src/content/persistence/ContentPersistence'

let db: ContentPersistence = null as unknown as ContentPersistence

export function useContentService() {
  const init = async (storage: ContentPersistence) => {
    db = storage
    await db.init()
    initListeners()
    console.debug(` ...initialized content: Service`, '✅')
  }

  const populateSearch = async (existingUrls: string[]) => {
    const contentItems = await getContents()
    contentItems.forEach((c: ContentItem) => {
      if (existingUrls.indexOf(c.url) >= 0) {
        //console.log('dispatching add-to-search')
        AppEventDispatcher.dispatchEvent('add-to-search', {
          name: '',
          title: c.title || '',
          url: c.url || '',
          description: c.metas ? c.metas['description' as keyof object] : '',
          content: c.content,
          tabsets: c.tabsetIds,
          favIconUrl: '',
        })
        // if (c.metas && c.metas['keywords']) {
        //   searchDoc.keywords = c.metas['keywords']
        // }
        // const removed = fuse.value.remove((doc: any) => {
        //   return doc.url === searchDoc.url
        // })
        // overwritten += removed.length
        // fuse.value.add(searchDoc)
        // urlSet.add(c.url)
        // count++
      } else {
        // countFiltered++
      }
    })
  }

  const saveContent = (
    tabId: string,
    tabUrl: string,
    text: string,
    metas: object,
    title: string,
    tabsetIds: string[],
  ): Promise<any> => {
    //console.debug('saving content for tabId', tabId) //, metas)
    return db.saveContent(
      tabId,
      JSON.parse(JSON.stringify(new ContentItem(tabId, title, tabUrl || '', text, metas, tabsetIds))),
    )
  }

  const updateContent = (tabId: string, c: ContentItem) => {
    return db.saveContent(tabId, JSON.parse(JSON.stringify(c)))
  }

  const deleteContent = (tabId: string) => {
    return db.deleteContent(tabId)
  }

  const getContent = (tabId: string): Promise<ContentItem | undefined> => {
    return db ? db.getContent(tabId) : Promise.reject('no db')
  }

  const getContents = (): Promise<ContentItem[]> => {
    return db ? db.getContents() : Promise.resolve([])
  }
  const cleanUpContent = (fnc: (tabId: string) => boolean) => {
    return db.cleanUpContent(fnc)
  }

  const getContentFor = (url: string): Promise<ContentItem | undefined> => {
    //console.log('getting content for url', url)
    return db ? db.getContentFor(url) : Promise.resolve(undefined)
  }

  const initListeners = () => {}

  return {
    init,
    saveContent,
    getContents,
    deleteContent,
    cleanUpContent,
    getContent,
    getContentFor,
    populateSearch,
    updateContent,
  }
}
