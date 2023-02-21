import {defineStore} from 'pinia';
import {computed, ref, watch} from "vue";
import {useQuasar} from "quasar";
import {useRoute} from "vue-router";
import {Tab} from "src/models/Tab";
import _ from "lodash"


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
  TAB_DETAILS = "tabDetails",
  NEW_TAB_URLS = "newTabUrls",
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

  const selectedTab = ref<Tab | undefined>(undefined)

  let rightDrawer = ref<RightDrawer>(new RightDrawer())
  let rightDrawerViewStack = ref<DrawerTabs[]>([DrawerTabs.UNASSIGNED_TABS])

  const rightDrawerFromStorage: RightDrawer | null = $q.localStorage.getItem('ui.rightDrawer')
  if (rightDrawerFromStorage !== null) {
   // console.log("got", rightDrawerFromStorage)
    if (rightDrawerFromStorage.activeTab !== DrawerTabs.TAB_DETAILS) {
      rightDrawer = ref<RightDrawer>(rightDrawerFromStorage)
    }
    if (rightDrawerFromStorage.activeTab !== DrawerTabs.UNASSIGNED_TABS && rightDrawerFromStorage.activeTab !== DrawerTabs.TAB_DETAILS) {
      rightDrawerViewStack = ref<DrawerTabs[]>([DrawerTabs.UNASSIGNED_TABS, rightDrawerFromStorage.activeTab])
    }
  }

  const newTabsetEmptyByDefault = ref<boolean>($q.localStorage.getItem('ui.newTabsetEmptyByDefault') as boolean || false)
  const tabBeingDragged = ref<string | undefined>(undefined)
  const dragEvent = ref<DragEvent | undefined>(undefined)
  const footerInfo = ref<string | undefined>(undefined)

  const contentCount = ref<number>(0)

  // info Messages
  const hiddenMessages = ref<string[]>($q.localStorage.getItem('ui.hiddenInfoMessages') as string[] || [])
  const messageAlreadyShown = ref<string | undefined>(undefined)
  const openTabMatchesTabsetTabs = ref(false)

  // new tab feature
  const newTabUrlList = ref<object[]>($q.localStorage.getItem('ui.newTabUrlList') as object[] || [])

  watch(leftDrawer.value, (val: Object) => {
    $q.localStorage.set("ui.leftDrawer", val)
  }, {deep: true})

  watch(rightDrawer.value, (val: Object) => {
    $q.localStorage.set("ui.rightDrawer", val)
  }, {deep: true})

  watch(newTabsetEmptyByDefault,
    (val: Object) => {
      $q.localStorage.set("ui.newTabsetEmptyByDefault", val)
    })

  watch(newTabUrlList,
    (val: object[]) => {
      console.log("newTabUrlList", val)
      $q.localStorage.set("ui.newTabUrlList", val)
    })

  watch(newTabUrlList.value,
    (val: object[]) => {
      console.log("val", val)
      $q.localStorage.set("ui.newTabUrlList", val)
    })

  const route = useRoute()
  watch(route, (to) => {
    // console.log("resetting", messageAlreadyShown.value)
    setAnotherMessageAlreadyShown(undefined)
  }, {flush: 'pre', immediate: true, deep: true})

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

  function draggingTab(tabId: string, evt: DragEvent) {
    tabBeingDragged.value = tabId
    dragEvent.value = evt
  }

  function droppingTab() {
    console.log("dropping tab", tabBeingDragged.value)
    const tabBeingDropped = tabBeingDragged.value
    tabBeingDragged.value = undefined
    dragEvent.value = undefined
    return tabBeingDropped
  }

  function setNewTabsetEmptyByDefault(defaultValue: boolean) {
    newTabsetEmptyByDefault.value = defaultValue
  }

  function addToNewTabUrlList(l: object) {
    newTabUrlList.value.push(l)
  }

  function removeNewTabUrl (url: string) {
    newTabUrlList.value = _.filter(newTabUrlList.value, (e:any) => e.url !== url)
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

  function rightDrawerSetActiveTab(tab: DrawerTabs) {
    rightDrawer.value.activeTab = tab
    if (rightDrawerViewStack.value[rightDrawerViewStack.value.length - 1] !== tab) {
      rightDrawerViewStack.value.push(tab)
    }
  }

  function rightDrawerSetLastView() {
    if (rightDrawerViewStack.value.length === 0) {
      rightDrawerViewStack.value.push(DrawerTabs.UNASSIGNED_TABS)
      rightDrawer.value = new RightDrawer()
      // } else if (rightDrawerViewStack.value.length === 1) {
      //   rightDrawer.value.activeTab = rightDrawerViewStack.value[0]
    } else {
      rightDrawerViewStack.value.pop()
      rightDrawer.value.activeTab = rightDrawerViewStack.value[rightDrawerViewStack.value.length - 1]
    }
  }

  const rightDrawerShowCloseButton = computed(() => () => rightDrawerViewStack.value.length > 1)

  const showMessage = computed(() => {
    return (ident: string, probability: number = 1, forceDisplay: boolean = false) => {
      //console.log("checking message", ident, probability, hiddenMessages.value)
      if (hiddenMessages.value.indexOf(ident) >= 0) {
        return false
      }
      if (forceDisplay) {
        return true
      }
      const couldBeShown = Math.random() < probability
      //console.log("could be shown", couldBeShown, messageAlreadyShown.value)
      if (couldBeShown && (messageAlreadyShown.value === undefined || messageAlreadyShown.value === ident)) {
        setAnotherMessageAlreadyShown(ident)
        return true
      } else if (messageAlreadyShown.value) {
        return false
      }
      return couldBeShown
    }
  })

  function setContentCount(val: number) {
    contentCount.value = val
  }

  const getContentCount = computed((): number => contentCount.value)

  function setSelectedTab(tab: Tab) {
    selectedTab.value = tab
  }

  const getSelectedTab = computed(() => {
    return selectedTab.value
  })

  return {
    leftDrawer,
    leftDrawerLabelIsAnimated,
    setLeftDrawerLabelAnimated,
    rightDrawer,
    rightDrawerSetLastView,
    rightDrawerViewStack,
    rightDrawerSetActiveTab,
    rightDrawerShowCloseButton,
    draggingTab,
    droppingTab,
    newTabsetEmptyByDefault,
    setNewTabsetEmptyByDefault,
    hideInfoMessage,
    restoreHints,
    showMessage,
    footerInfo,
    getContentCount,
    setContentCount,
    setSelectedTab,
    getSelectedTab,
    newTabUrlList,
    addToNewTabUrlList,
    removeNewTabUrl
  }
})
