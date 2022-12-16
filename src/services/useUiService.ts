import {LeftDrawer, LeftDrawerState, LeftDrawerTabs, useUiStore} from "stores/uiStore";

export function useUiService() {

  const useSmallDrawerView = (): boolean => {
    const uiStore = useUiStore()
    return uiStore.leftDrawer.state === LeftDrawerState.SMALL
  }

  const toggleDrawer = (): void => {
    const leftDrawer = useUiStore().leftDrawer
    console.log("toggleDrawer",leftDrawer)
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


  return {
    useSmallDrawerView,
    toggleDrawer,
    drawerModel,
    leftDrawerActiveTab,
    leftDrawerSetActiveTab
  }

}
