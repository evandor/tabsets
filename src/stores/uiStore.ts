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
  const addTabsAutomaticallyDefault = ref<boolean>($q.localStorage.getItem('ui.addTabsAutomatically') as boolean || true)
  const tabBeingDragged = ref<string | undefined>(undefined)

  watch(leftDrawer.value, (val: Object) => {
    $q.localStorage.set("ui.leftDrawer", val)
  }, {deep: true})

  watch(tabsetIdForNewTab, (val: Object) => {
    $q.localStorage.set("ui.tabsetIdForNewTab", val)
  }, {deep: true})

  watch(addTabsAutomaticallyDefault,
    (val: Object) => {
      $q.localStorage.set("ui.addTabsAutomatically", val)
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

  function setAddAutomaticDefault(defaultValue: boolean) {
    addTabsAutomaticallyDefault.value = defaultValue
  }

  return {
    leftDrawer,
    leftDrawerLabelIsAnimated,
    setLeftDrawerLabelAnimated,
    setTabsetForNewTabPage,
    tabsetIdForNewTab,
    draggingTab,
    droppingTab,
    addTabsAutomaticallyDefault,
    setAddAutomaticDefault
  }
})
