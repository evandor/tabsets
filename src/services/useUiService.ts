import {DrawerTabs, LeftDrawer, LeftDrawerState, useUiStore} from "stores/uiStore";

export function useUiService() {

  const useSmallDrawerView = (): boolean => {
    const uiStore = useUiStore()
    return uiStore.leftDrawer.state === LeftDrawerState.SMALL
  }

  const toggleDrawer = (): void => {
    const leftDrawer = useUiStore().leftDrawer
    //console.log("toggleDrawer",leftDrawer)
   // leftDrawer.isHidden = true
    switch (leftDrawer.state) {
      case LeftDrawerState.SMALL:
        leftDrawer.state = LeftDrawerState.WIDE
        break
      default:
        leftDrawer.state = LeftDrawerState.SMALL
    }
   // setTimeout(() => leftDrawer.isHidden = false, 50)
  }

  const drawerModel = ():LeftDrawer => {
    return useUiStore().leftDrawer
  }

  const leftDrawerActiveTab = (): DrawerTabs => useUiStore().leftDrawer.activeTab
  const rightDrawerActiveTab = (): DrawerTabs => useUiStore().rightDrawer.activeTab


  const  leftDrawerSetActiveTab = (tab: DrawerTabs) => {
    useUiStore().leftDrawer.activeTab = tab
    useUiStore().leftDrawer.state = LeftDrawerState.WIDE
  }
  const  rightDrawerSetActiveTab = (tab: DrawerTabs) => {
    useUiStore().rightDrawerSetActiveTab(tab)
  }

  const leftDrawerAnimateLabel = () => {
    useUiStore().setLeftDrawerLabelAnimated(true)
    setTimeout(() => useUiStore().setLeftDrawerLabelAnimated(false),  1000);
  }

  const leftDrawerAnimate = () => useUiStore().leftDrawerLabelIsAnimated()

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

  const  draggingTab = (tabId: string) => useUiStore().draggingTab(tabId)
  const  droppingTab = ():string | undefined => useUiStore().droppingTab()

  const closeCurrentView = () => {
    useUiStore().rightDrawerSetLastView()
  }

  return {
    useSmallDrawerView,
    toggleDrawer,
    drawerModel,
    leftDrawerActiveTab,
    leftDrawerSetActiveTab,
    leftDrawerAnimateLabel,
    leftDrawerAnimate,
    rightDrawerActiveTab,
    rightDrawerSetActiveTab,
    showSearchResultsPageFor,
    draggingTab,
    droppingTab,
    closeCurrentView
  }

}
