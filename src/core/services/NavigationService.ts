import { LocalStorage } from 'quasar'
import { useWindowsStore } from 'src/windows/stores/windowsStore'

export function useNavigationService() {
  const placeholderPattern = /\${[^}]*}/gm

  const init = async () => {}

  const browserTabFor = async (url: string, tabId: string | undefined = undefined): Promise<chrome.tabs.Tab> => {
    url = url.replace(placeholderPattern, '')
    //console.log(` > opening url '${url}' in current window`)

    // getting all tabs from this window
    const tabsFromBrowser: chrome.tabs.Tab[] = await chrome.tabs.query({ currentWindow: true }) // url in queryInfo ignores fragments!
    const tabs = tabsFromBrowser.filter((t: chrome.tabs.Tab) => t.url === url)
    if (tabs.length === 0) {
      //console.debug('tab not found, creating new one:', url)
      const createdTab = await chrome.tabs.create({
        active: true,
        pinned: false,
        url: url,
      })

      LocalStorage.setItem('ui.currentTab.id', tabId)

      return Promise.resolve(createdTab)
    }
    await chrome.tabs.update(tabs[0]!.id!, { active: true }).then((chromeTab: chrome.tabs.Tab) => {
      // if (forceReload) {
      //   chrome.tabs.reload(chromeTab.id!, { bypassCache: true })
      // }
    })
    return Promise.resolve(tabs[0]!)
  }

  const openTabsInNewWindow = async (withUrls: string[], windowName: string) => {
    console.log(` > opening #url ${withUrls.length} in window: '${windowName}'`)

    const windowFromDb = await useWindowsStore().windowFor(windowName)
    const existingWindow = await useWindowsStore().currentWindowFor(windowName)

    console.log('existingWindow:', windowFromDb, existingWindow)
    if (!existingWindow) {
      const createData: chrome.windows.CreateData = { url: withUrls }
      if (windowFromDb) {
        const w = windowFromDb.browserWindow
        createData.left = w?.left || 50
        createData.top = w?.top || 50 //(w.top || 0) < 0 ? 0 : w.top
        createData.width = w?.width || 1200 //(w.width || -1) < 0 ? 600 : w.width
        createData.height = w?.height || 800 //(w.top || -1) < 0 ? 400 : w.height
        // window does not exist anymore, remove from 'allWindows'
        await useWindowsStore().removeWindow(windowFromDb.id)
      }

      return await createNewWindow(createData, windowName, withUrls)
    }
    return Promise.reject('not implemented')
  }

  const createNewWindow = async (createData: chrome.windows.CreateData, useWindowIdent: string, withUrls: string[]) => {
    console.log('opening new window with', createData)
    return await chrome.windows.create(createData)
  }

  return {
    init,
    browserTabFor,
    openTabsInNewWindow,
  }
}
