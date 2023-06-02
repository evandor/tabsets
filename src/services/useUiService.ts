import {DrawerTabs, useUiStore} from "src/stores/uiStore";

export function useUiService() {

  const rightDrawerActiveTab = (): DrawerTabs => useUiStore().rightDrawer.activeTab


  const  rightDrawerSetActiveTab = (tab: DrawerTabs, data: object = {}) => {
    useUiStore().rightDrawerSetActiveTab(tab)
    if (data && data['entityType' as keyof object]) {
      useUiStore().setEntityType(data['entityType' as keyof object])
    }
    if (data && data['tabsetId' as keyof object]) {
      useUiStore().setSelectedTabsetId(data['tabsetId' as keyof object])
    }
  }

  const showSearchResultsPageFor = (term: string) => {
    window.location.href = window.location.href.split('#')[0] +  "#/search?t=" + term
    // const selfId = localStorage.getItem("selfId")
    // if (selfId) {
      chrome.tabs.query({title: `Tabsets Extension`}, (result: chrome.tabs.Tab[]) => {
        if (result && result.length > 0) {
          const tab = result[0]
          if (tab.id) {
            chrome.tabs.update(tab.id, {active: true})
          }
        }
      })
    //}
  }

  const  draggingTab = (tabId: string, evt: DragEvent, doSendMessage = false) =>
    useUiStore().draggingTab(tabId, evt, doSendMessage)

  const  droppingTab = ():string | undefined => useUiStore().droppingTab()

  // const closeCurrentView = () => {
  //   useUiStore().rightDrawerSetLastView()
  // }

  const closeRightDrawer = () => {
    useUiStore().rightDrawerOpen = false
  }

  const toggleLeftDrawer = () => {
    useUiStore().leftDrawerOpen = !useUiStore().leftDrawerOpen
  }

  return {
    rightDrawerActiveTab,
    rightDrawerSetActiveTab,
    showSearchResultsPageFor,
    draggingTab,
    droppingTab,
    closeRightDrawer,
    toggleLeftDrawer
  }

}
