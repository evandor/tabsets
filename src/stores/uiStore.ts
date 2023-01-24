import {defineStore} from 'pinia';
import {computed, ref, watch} from "vue";
import {useQuasar} from "quasar";
import {useRoute} from "vue-router";


export enum LeftDrawerState {
  SMALL = "SMALL",
  WIDE = "WIDE"
}

export enum DrawerTabs {
  BOOKMARKS = "bookmarks",
  OPEN_TABS = "openTabs",
  UNASSIGNED_TABS = "unassignedTabs",
  GROUP_BY_HOST_TABS = "groupedByHostTabs",
  SAVED_TABS = "savedTabs",
  SIDEBAR = "sidebar",
  RSS = "rss",
  SCHEDULED = "scheduled",
  HISTORY = "history",
  FEATURES = "features",
  HELP = "help"
}

export class LeftDrawer {
  constructor(
    public state: LeftDrawerState,
    public activeTab: DrawerTabs = DrawerTabs.OPEN_TABS) {
  }
}

export class RightDrawer {
  constructor(
    public activeTab: DrawerTabs = DrawerTabs.UNASSIGNED_TABS) {
  }
}

export const useUiStore = defineStore('ui', () => {

  const $q = useQuasar()

  const leftDrawer = ref<LeftDrawer>($q.localStorage.getItem('ui.leftDrawer') || new LeftDrawer(LeftDrawerState.SMALL))
  const leftDrawerLabelAnimated = ref(false)

  const rightDrawer = ref<RightDrawer>($q.localStorage.getItem('ui.rightDrawer') || new RightDrawer())
  const rightDrawerViewStack = ref<DrawerTabs[]>([DrawerTabs.UNASSIGNED_TABS])

  const tabsetIdForNewTab = ref<string | undefined>($q.localStorage.getItem('ui.tabsetIdForNewTab') as string || undefined)
  const newTabsetEmptyByDefault = ref<boolean>($q.localStorage.getItem('ui.newTabsetEmptyByDefault') as boolean || false)
  const tabBeingDragged = ref<string | undefined>(undefined)
  const footerInfo = ref<string | undefined>(undefined)

  // info Messages
  const hiddenMessages = ref<string[]>($q.localStorage.getItem('ui.hiddenInfoMessages') as string[] || [])
  const messageAlreadyShown = ref<string | undefined>(undefined)
  const openTabMatchesTabsetTabs = ref(false)

  watch(leftDrawer.value, (val: Object) => {
    $q.localStorage.set("ui.leftDrawer", val)
  }, {deep: true})

  watch(rightDrawer.value, (val: Object) => {
    $q.localStorage.set("ui.rightDrawer", val)
  }, {deep: true})

  watch(tabsetIdForNewTab, (val: Object) => {
    $q.localStorage.set("ui.tabsetIdForNewTab", val)
  }, {deep: true})

  watch(newTabsetEmptyByDefault,
    (val: Object) => {
      $q.localStorage.set("ui.newTabsetEmptyByDefault", val)
    })

  const route = useRoute()
  watch(route, (to) => {
    // console.log("resetting", messageAlreadyShown.value)
    setAnotherMessageAlreadyShown(undefined)
  }, {flush: 'pre', immediate: true, deep: true})

  // watch(hiddenMessages.value,
  //   (val: string[], val2: string[]) => {
  //     console.log("watching", val, val2)
  //     $q.localStorage.set("ui.hiddenInfoMessages", val)
  //   })

  watch(
    hiddenMessages,
    (thresholdsVal: Object) => {
      $q.localStorage.set("ui.hiddenInfoMessages", thresholdsVal)
    }, {deep: true}
  )

  const leftDrawerLabelIsAnimated = computed(() => {
    return () => leftDrawerLabelAnimated.value
  })

  function setLeftDrawerLabelAnimated(animated: boolean) {
    leftDrawerLabelAnimated.value = animated
  }

  const setTabsetForNewTabPage = (tabsetId: string) => {
    tabsetIdForNewTab.value = tabsetId
  }

  function draggingTab(tabId: string) {
    tabBeingDragged.value = tabId
  }

  function droppingTab() {
    const tabBeingDropped = tabBeingDragged.value
    tabBeingDragged.value = undefined
    return tabBeingDropped
  }

  function setNewTabsetEmptyByDefault(defaultValue: boolean) {
    newTabsetEmptyByDefault.value = defaultValue
  }

  function hideInfoMessage(ident: string) {
    hiddenMessages.value.push(ident)
  }

  function restoreHints() {
    console.log("hiddenMessages.value", hiddenMessages.value)
    hiddenMessages.value = []
    setAnotherMessageAlreadyShown(undefined)
  }

  function setAnotherMessageAlreadyShown(msg: string | undefined) {
    //console.log("setting setAnotherMessageAlreadyShown", msg)
    messageAlreadyShown.value = msg
  }

  function rightDrawerSetLastView() {
    console.log("here", rightDrawerViewStack.value)
    if (rightDrawerViewStack.value.length === 0) {
      rightDrawerViewStack.value.push(DrawerTabs.UNASSIGNED_TABS)
      rightDrawer.value = new RightDrawer()
    } else if (rightDrawerViewStack.value.length === 1) {
      rightDrawer.value.activeTab = rightDrawerViewStack.value[0]
    } else {
      rightDrawer.value.activeTab = rightDrawerViewStack.value.pop() as unknown as DrawerTabs
    }
    console.log("after1", rightDrawer.value)
    console.log("after2", rightDrawerViewStack.value)

  }

  const rightDrawerShowCloseButton = computed(() => {
    console.log("rightDrawerShowCloseButton",rightDrawerViewStack.value)
    return () => rightDrawerViewStack.value.length > 0
  })

  const showMessage = computed(() => {
    return (ident: string, probability: number = 1) => {
      //console.log("checking message", ident, probability, hiddenMessages.value)
      if (hiddenMessages.value.indexOf(ident) >= 0) {
        return false
      }
      const couldBeShown = Math.random() < probability
      //console.log("could be shown", couldBeShown, messageAlreadyShown.value)
      if (couldBeShown && (messageAlreadyShown.value === undefined || messageAlreadyShown.value === ident)) {
        //console.log("stting to ", ident)
        setAnotherMessageAlreadyShown(ident)
        return true
      } else if (messageAlreadyShown.value) {
        return false
      }
      return couldBeShown
    }
  })

  return {
    leftDrawer,
    leftDrawerLabelIsAnimated,
    setLeftDrawerLabelAnimated,
    rightDrawer,
    rightDrawerSetLastView,
    rightDrawerShowCloseButton,
    setTabsetForNewTabPage,
    tabsetIdForNewTab,
    draggingTab,
    droppingTab,
    newTabsetEmptyByDefault,
    setNewTabsetEmptyByDefault,
    hideInfoMessage,
    restoreHints,
    showMessage,
    footerInfo
  }
})
