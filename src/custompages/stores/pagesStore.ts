import { defineStore } from 'pinia'
import { Page } from 'src/custompages/models/backend'
import CustomPagesPersistence from 'src/custompages/persistence/CustomPagesPersistence'
import { ref } from 'vue'

export const usePagesStore = defineStore('pages', () => {
  /**
   * A Map of all active pages identified by their ids
   */
  const pages = ref<Map<string, Page>>(new Map<string, Page>())

  const initialized = ref(false)

  let storage: CustomPagesPersistence = null as unknown as CustomPagesPersistence

  async function initialize(p: CustomPagesPersistence) {
    storage = p
    await storage.init()
    initialized.value = true
  }

  const updatePage = async (page: Page) => {
    await storage.addPage(page)
  }

  const deletePage = async (pageId: string) => {
    return storage.deletePage(pageId)
  }

  const loadPage = (pageId: string): Promise<Page> => {
    console.log('loading pageId', pageId)
    return storage.loadPage(pageId)
  }

  return {
    initialize,
    updatePage,
    deletePage,
    loadPage,
    initialized,
  }
})
