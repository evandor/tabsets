import {LeftDrawer, LeftDrawerState, LeftDrawerTabs, useUiStore} from "stores/uiStore";

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

  const leftDrawerActiveTab = (): LeftDrawerTabs => {
    const uiStore = useUiStore()
    return uiStore.leftDrawer.activeTab
  }

  const  leftDrawerSetActiveTab = (tab: LeftDrawerTabs) => {
    useUiStore().leftDrawer.activeTab = tab
    useUiStore().leftDrawer.state = LeftDrawerState.WIDE
  }

  const leftDrawerAnimateLabel = () => {
    useUiStore().setLeftDrawerLabelAnimated(true)
    setTimeout(() => useUiStore().setLeftDrawerLabelAnimated(false),  1000);
  }

  const leftDrawerAnimate = () => useUiStore().leftDrawerLabelIsAnimated()

  const showSearchResultsPageFor = (term: string) => {
    window.location.href = window.location.href.split('#')[0] +  "#/search?t=" + term
    const selfId = localStorage.getItem("selfId")
    if (selfId) {
      chrome.tabs.query({title: `Tabsets Extension`}, (result: chrome.tabs.Tab[]) => {
        if (result && result.length > 0) {
          const tab = result[0]
          if (tab.id) {
            chrome.tabs.update(tab.id, {active: true})
          }
        }
      })
    }
  }

  const setTabsetForNewTabPage = (tabsetId: string) => {
    useUiStore().setTabsetForNewTabPage(tabsetId)
  }

  return {
    useSmallDrawerView,
    toggleDrawer,
    drawerModel,
    leftDrawerActiveTab,
    leftDrawerSetActiveTab,
    leftDrawerAnimateLabel,
    leftDrawerAnimate,
    showSearchResultsPageFor,
    setTabsetForNewTabPage
  }

}
