import { defineStore } from 'pinia'
import { LocalStorage } from 'quasar'
import BrowserApi from 'src/app/BrowserApi'
import { ref } from 'vue'

type WindowToTabsetId = { [k: string]: string }

const CURRENT_TABSET_STORAGE_ID = 'selectedTabset'
const CURRENT_TABSETS_STORAGE_ID = 'selectedTabsets'

const useTabsetToWindowStore = defineStore('tabsetToWindowStore', () => {
  const currentTabsetToWindowMap = ref<Map<string, string>>(new Map())
  return {
    currentTabsetToWindowMap,
  }
})

const getWindowIdentifier = (w: chrome.windows.Window) => {
  return 'window-' + w.id || w.sessionId || '0'
}

function deleteWindow(windowIdent: string) {
  useTabsetToWindowStore().currentTabsetToWindowMap.delete(windowIdent)
  const oldTabsets = LocalStorage.getItem(CURRENT_TABSETS_STORAGE_ID) as string | undefined
  if (oldTabsets) {
    const mapping: WindowToTabsetId = oldTabsets as unknown as WindowToTabsetId
    delete mapping[windowIdent]
    LocalStorage.setItem(CURRENT_TABSETS_STORAGE_ID, mapping)
  }
}

/**
 * keeps a mapping between browser windows and default (current) tabset ids as well as a fallback id (defaultCurrentTabsetId).
 *
 * This mapping is persisted in localStorage. When a user selects a different tabset, the current tabset id will be updated for
 * the current window, as well as for the defaultCurrentTabsetId.
 *
 * When starting tabsets, this mapping will be queried to decide which tabset to show.
 */
export function useSelectedTabsetService() {
  let defaultCurrentTabsetId: string | undefined

  const getFromStorage = async (): Promise<string | undefined> => {
    const defaultCurrentTabset = (LocalStorage.getItem(CURRENT_TABSET_STORAGE_ID) as string) || undefined
    const selectedTabsets = LocalStorage.getItem(CURRENT_TABSETS_STORAGE_ID) as object | undefined
    // console.log(`... selecting from storage ${defaultCurrentTabset}`)
    if (selectedTabsets) {
      const w = await chrome.windows.getCurrent()
      if (selectedTabsets) {
        const ident = getWindowIdentifier(w)
        if (selectedTabsets[ident as keyof object]) {
          // console.log(`returning for window ${ident}: ${selectedTabsets[ident as keyof object]}`)
          return Promise.resolve(selectedTabsets[ident as keyof object])
        }
      }
    }
    return defaultCurrentTabset
  }

  const setCurrentTabsetId = async (tabsetId: string | undefined) => {
    if (!chrome || !chrome.windows) {
      return Promise.resolve()
    }
    const w: chrome.windows.Window = await chrome.windows.getCurrent()
    // chrome.windows.getCurrent((w: chrome.windows.Window) => {
    const oldTabsets = LocalStorage.getItem(CURRENT_TABSETS_STORAGE_ID) as string | undefined
    const ident = getWindowIdentifier(w)
    if (tabsetId) {
      //console.log(`setting selected tabset to ${tabsetId} for window ${ident}`)

      LocalStorage.setItem(CURRENT_TABSET_STORAGE_ID, tabsetId)
      useTabsetToWindowStore().currentTabsetToWindowMap.set('window-' + w.id || w.sessionId || '0', tabsetId)

      if (!oldTabsets) {
        const l: WindowToTabsetId = {}
        l[ident] = tabsetId
        LocalStorage.setItem(CURRENT_TABSETS_STORAGE_ID, l)
      } else {
        const mapping: WindowToTabsetId = oldTabsets as unknown as WindowToTabsetId
        mapping[ident] = tabsetId
        LocalStorage.setItem(CURRENT_TABSETS_STORAGE_ID, mapping)
      }
    } else {
      localStorage.removeItem(CURRENT_TABSET_STORAGE_ID)
      deleteWindow(ident)
      // if (oldTabsets) {
      //   const mapping: WindowToTabsetId = oldTabsets as unknown as WindowToTabsetId
      //   delete mapping[ident]
      //   LocalStorage.setItem(CURRENT_TABSETS_STORAGE_ID, mapping)
      // }
    }
  }

  const getSelectedTabsetId = async (): Promise<any> => {
    try {
      const w = await chrome.windows.getCurrent({})
      const ident = getWindowIdentifier(w)
      return w ? useTabsetToWindowStore().currentTabsetToWindowMap.get(ident) : defaultCurrentTabsetId
    } catch (error) {
      console.debug('returning defaultCurrentTabsetId', defaultCurrentTabsetId)
      return Promise.resolve(defaultCurrentTabsetId)
    }
  }

  /**
   * delete default selected tabset from storage if equal to the deleted one;
   * remove from windows map
   */
  const clearCurrentTabsetId = async (deletedTsId: string) => {
    const defaultTsInStorage = LocalStorage.getItem(CURRENT_TABSET_STORAGE_ID)
    if (defaultTsInStorage == deletedTsId) {
      LocalStorage.remove(CURRENT_TABSET_STORAGE_ID)
      defaultCurrentTabsetId = undefined
    }
    let windowToDelete: string | undefined = undefined
    for (const entry of useTabsetToWindowStore().currentTabsetToWindowMap) {
      if (entry[1] == deletedTsId) {
        windowToDelete = entry[0]
      }
    }
    if (windowToDelete) {
      deleteWindow(windowToDelete)
    }
  }

  const clearWindow = async (windowId: number) => {
    const pseudoWindow = BrowserApi.createChromeWindowObject(windowId, 0, 0)
    const ident = getWindowIdentifier(pseudoWindow)
    // console.log('clearing window', windowId, ident)
    // console.log('1', useTabsetToWindowStore().currentTabsetToWindowMap)
    // useTabsetToWindowStore().currentTabsetToWindowMap.delete(ident)
    // console.log('2', useTabsetToWindowStore().currentTabsetToWindowMap)
    //LocalStorage.setItem(CURRENT_TABSETS_STORAGE_ID, useTabsetToWindowStore().currentTabsetToWindowMap)
    deleteWindow(ident)
    // const oldTabsets = LocalStorage.getItem(CURRENT_TABSETS_STORAGE_ID) as string | undefined
    // if (oldTabsets) {
    //   const mapping: WindowToTabsetId = oldTabsets as unknown as WindowToTabsetId
    //   delete mapping[ident]
    //   LocalStorage.setItem(CURRENT_TABSETS_STORAGE_ID, mapping)
    // }
  }

  return {
    getFromStorage,
    setCurrentTabsetId,
    getSelectedTabsetId,
    clearCurrentTabsetId,
    clearWindow,
  }
}
