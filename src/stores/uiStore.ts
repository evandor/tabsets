import {defineStore} from 'pinia';
import {computed, ref, watch} from "vue";
import {useQuasar} from "quasar";


export enum LeftDrawerState {
  SMALL = "SMALL",
  WIDE = "WIDE"
}

export enum LeftDrawerTabs {
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
    public activeTab: LeftDrawerTabs = LeftDrawerTabs.OPEN_TABS) {
  }
}

export const useUiStore = defineStore('ui', () => {

  const $q = useQuasar()

  const leftDrawer = ref<LeftDrawer>($q.localStorage.getItem('ui.leftDrawer') || new LeftDrawer(LeftDrawerState.SMALL))
  const leftDrawerLabelAnimated = ref(false)
  const tabsetIdForNewTab = ref<string | undefined>($q.localStorage.getItem('ui.tabsetIdForNewTab') as string || undefined)
  const newTabsetEmptyByDefault = ref<boolean>($q.localStorage.getItem('ui.newTabsetEmptyByDefault') as boolean || false)
  const tabBeingDragged = ref<string | undefined>(undefined)
  const hiddenMessages = ref<string[]>($q.localStorage.getItem('ui.hiddenInfoMessages') as string[] || [])

  watch(leftDrawer.value, (val: Object) => {
    $q.localStorage.set("ui.leftDrawer", val)
  }, {deep: true})

  watch(tabsetIdForNewTab, (val: Object) => {
    $q.localStorage.set("ui.tabsetIdForNewTab", val)
  }, {deep: true})

  watch(newTabsetEmptyByDefault,
    (val: Object) => {
      $q.localStorage.set("ui.newTabsetEmptyByDefault", val)
    })

  watch(hiddenMessages.value,
    (val: string[]) => {
      $q.localStorage.set("ui.hiddenInfoMessages", val)
    })

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

  function infoMessageHidden(ident: string) {
    return hiddenMessages.value.indexOf(ident) >= 0
  }

  function restoreHints() {
    hiddenMessages.value = []
  }

  return {
    leftDrawer,
    leftDrawerLabelIsAnimated,
    setLeftDrawerLabelAnimated,
    setTabsetForNewTabPage,
    tabsetIdForNewTab,
    draggingTab,
    droppingTab,
    newTabsetEmptyByDefault,
    setNewTabsetEmptyByDefault,
    hideInfoMessage,
    infoMessageHidden,
    restoreHints
  }
})
