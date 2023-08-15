import {defineStore} from 'pinia';
import {computed, ref, watch} from "vue";
import {useRoute, useRouter} from "vue-router";
import {Tab} from "src/models/Tab";
import _ from "lodash"
import {LocalStorage, useQuasar} from "quasar";
import {useUtils} from "src/services/Utils";
import {useTabsStore} from "stores/tabsStore";
import {FeatureIdent} from "src/models/AppFeature";
import {usePermissionsStore} from "stores/permissionsStore";

export enum DrawerTabs {
  BOOKMARKS = "bookmarks",
  OPEN_TABS = "openTabs",
  UNASSIGNED_TABS = "unassignedTabs",
  GROUP_BY_HOST_TABS = "groupedByHostTabs",
  SAVED_TABS = "savedTabs",
  PDF_TABS = "pdfTabs",
  RSS = "rss",
  SCHEDULED = "scheduled",
  HISTORY = "history",
  FEATURES = "features",
  TAB_DETAILS = "tabDetails",
  TABSET_DETAILS = "tabsetDetails",
  NEW_TAB_URLS = "newTabUrls",
  TAGS_VIEWER = "tagsViewer",
  HELP = "help"
}

export class SidePanelView {

  static readonly MAIN = new SidePanelView('main', '/sidepanel');

  static readonly TABS_LIST = new SidePanelView('tabsList', '/sidepanel/tabslist',
    () => usePermissionsStore().hasFeature(FeatureIdent.OPEN_TABS) && useTabsStore().tabs?.length > 1);

  static readonly TAGS_LIST = new SidePanelView('tagsList', '/sidepanel/tagslist',
    () => usePermissionsStore().hasFeature(FeatureIdent.TAGS) && useTabsStore().allTabsCount > 0);

  static readonly TAG = new SidePanelView('tag', '/sidepanel/tags');

  static readonly BY_DOMAIN_LIST = new SidePanelView('byDomainList', '/sidepanel/byDomainList',
    () => usePermissionsStore().hasFeature(FeatureIdent.GROUP_BY_DOMAIN));

  static readonly RSS_LIST = new SidePanelView('rssList', '/sidepanel/rsslist',
    () => usePermissionsStore().hasFeature(FeatureIdent.RSS));

  static readonly NEWEST_TABS_LIST = new SidePanelView('newestList', '/sidepanel/newestList',
    () => usePermissionsStore().hasFeature(FeatureIdent.NEWEST_TABS));

  static readonly TOP_10_TABS_LIST = new SidePanelView('top10List', '/sidepanel/top10List',
    () => usePermissionsStore().hasFeature(FeatureIdent.TOP10));

  static readonly BOOKMARKS = new SidePanelView('bookmarks', '/sidepanel/bookmarks',
    () => usePermissionsStore().hasFeature(FeatureIdent.BOOKMARKS));

  static readonly PUBLIC_TABSETS = new SidePanelView('categorized_tabsets', '/sidepanel/byCategory',
    () => usePermissionsStore().hasFeature(FeatureIdent.BOOKMARKS));

  private constructor(
    public readonly ident: string,
    public readonly path: any,
    public readonly showButtonFunction: Function = () => true) {
  }

  toString() {
    return this.ident;
  }

  showButton() {
    return this.showButtonFunction()
  }
}

export enum ListDetailLevel {
  MINIMAL = "MINIMAL",
  SOME = "SOME",
  MAXIMAL = "MAXIMAL"
}

export class RightDrawer {
  constructor(
    public activeTab: DrawerTabs = DrawerTabs.UNASSIGNED_TABS) {
  }
}

export class SidePanel {
  constructor(
    public activeView: SidePanelView = SidePanelView.MAIN) {
  }
}


export const useUiStore = defineStore('ui', () => {

  const $q = useQuasar()
  const router = useRouter()

  const {sendMsg} = useUtils()

  const selectedTab = ref<Tab | undefined>(undefined)
  const tabsFilter = ref<string | undefined>(undefined)
  const selectedTag = ref<string | undefined>(undefined)
  const tabsetsExpanded = ref<boolean>(false)

  // RightDrawer
  let rightDrawer = ref<RightDrawer>(new RightDrawer())
  let rightDrawerOpen = ref($q.screen.gt.md)
  let leftDrawerOpen = ref(true)

  // SidePanel
  let sidePanel = ref<SidePanel>(new SidePanel())

  const highlightTerm = ref<string | undefined>(undefined)

  const newTabsetEmptyByDefault = ref<boolean>(LocalStorage.getItem('ui.newTabsetEmptyByDefault') as unknown as boolean || false)
  const tabBeingDragged = ref<string | undefined>(undefined)
  const dragEvent = ref<DragEvent | undefined>(undefined)
  const footerInfo = ref<string | undefined>(undefined)

  const contentCount = ref<number>(0)

  const listDetailLevel = ref<ListDetailLevel>(LocalStorage.getItem('detailLevel') || ListDetailLevel.MAXIMAL)

  // info Messages
  const hiddenMessages = ref<string[]>(LocalStorage.getItem('ui.hiddenInfoMessages') as unknown as string[] || [])
  const messageAlreadyShown = ref<string | undefined>(undefined)
  const openTabMatchesTabsetTabs = ref(false)

  // highlight url(s) feature
  const highlightUrls = ref<string[]>([])

  // new tab feature
  const newTabUrlList = ref<object[]>(LocalStorage.getItem('ui.newTabUrlList') as unknown as object[] || [])

  // listener currently triggered on '/' keypress for search keyboard shortcut
  const ignoreKeypress = ref(false)

  // entity management
  const entityType = ref<string | undefined>(undefined)
  const selectedTabsetId = ref<string | undefined>(undefined)

  // system management
  const dbReady = ref<boolean>(false)

  const progress = ref<number | undefined>(undefined)
  const progressLabel = ref<string | undefined>(undefined)

  watch(rightDrawer.value, (val: Object) => {
    LocalStorage.set("ui.rightDrawer", val)
  }, {deep: true})

  watch(newTabsetEmptyByDefault,
    (val: Object) => {
      LocalStorage.set("ui.newTabsetEmptyByDefault", val)
    })

  watch(newTabUrlList,
    (val: object[]) => {
      console.log("newTabUrlList", val)
      LocalStorage.set("ui.newTabUrlList", val)
    })

  watch(newTabUrlList.value,
    (val: object[]) => {
      console.log("val", val)
      LocalStorage.set("ui.newTabUrlList", val)
    })

  const route = useRoute()
  watch(route, (to) => {
    // console.log("resetting", messageAlreadyShown.value)
    setAnotherMessageAlreadyShown(undefined)
  }, {flush: 'pre', immediate: true, deep: true})

  watch(
    hiddenMessages,
    (thresholdsVal: Object) => {
      LocalStorage.set("ui.hiddenInfoMessages", thresholdsVal)
    }, {deep: true}
  )

  function draggingTab(tabId: string, evt: DragEvent, doSendMessage = false) {
    tabBeingDragged.value = tabId
    dragEvent.value = evt
    if (doSendMessage) {
      sendMsg("tab-being-dragged", {
        tabId: tabId
      })
    }
  }

  function droppingTab() {
    console.log("dropping tab", tabBeingDragged.value)
    const tabBeingDropped = tabBeingDragged.value
    tabBeingDragged.value = undefined
    dragEvent.value = undefined
    return tabBeingDropped
  }

  function setSelectedTag(tag: string) {
    selectedTag.value = tag
  }

  function setNewTabsetEmptyByDefault(defaultValue: boolean) {
    newTabsetEmptyByDefault.value = defaultValue
  }

  function addToNewTabUrlList(l: object) {
    newTabUrlList.value.push(l)
  }

  function removeNewTabUrl(url: string) {
    newTabUrlList.value = _.filter(newTabUrlList.value, (e: any) => e.url !== url)
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
    rightDrawerOpen.value = true
  }

  function sidePanelSetActiveView(view: SidePanelView) {
    sidePanel.value.activeView = view
    router.push(view.path)
  }

  const sidePanelActiveViewIs = computed(() => {
    return (viewToCompare: SidePanelView) => {
      return sidePanel.value.activeView?.ident === viewToCompare.ident
    }
  })

  function setEntityType(type: string) {
    entityType.value = type
  }

  function setSelectedTabsetId(id: string) {
    selectedTabsetId.value = id
  }

  function setHighlightTerm(term: string | undefined) {
    highlightTerm.value = term
  }

  function setListDetailLevel(val: ListDetailLevel) {
    listDetailLevel.value = val
  }

  const listDetailLevelGreaterEqual = computed(() => {
    return (level: ListDetailLevel) => {
      switch (listDetailLevel.value) {
        case ListDetailLevel.MAXIMAL:
          return true
        case ListDetailLevel.SOME:
          return level === ListDetailLevel.SOME || level === ListDetailLevel.MINIMAL
        case ListDetailLevel.MINIMAL:
          return level === ListDetailLevel.MINIMAL
      }
    }
  })

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

  const sidePanelIsActive = computed(() => {
    return (view: SidePanelView) => sidePanel.value.activeView?.ident === view.ident
  })

  function setContentCount(val: number) {
    contentCount.value = val
  }

  const getContentCount = computed((): number => contentCount.value)

  function setSelectedTab(tab: Tab) {
    console.log("setting selected tab", tab)
    selectedTab.value = tab
  }

  const getSelectedTab = computed(() => {
    return selectedTab.value
  })

  // highlight url(s) feature
  function clearHighlights() {
    highlightUrls.value = []
  }

  function addHighlight(url: string) {
    highlightUrls.value.push(url)
  }

  const getHighlightUrls = computed(() => highlightUrls.value)

  function ignoreKeypressListener() {
    return ignoreKeypress.value;
  }

  function setIgnoreKeypress(b: boolean) {
    ignoreKeypress.value = b
  }

  function toggleLeftDrawer() {
    leftDrawerOpen.value = !leftDrawerOpen.value
  }

  return {
    rightDrawer,
    rightDrawerOpen,
    leftDrawerOpen,
    rightDrawerSetActiveTab,
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
    removeNewTabUrl,
    clearHighlights,
    addHighlight,
    getHighlightUrls,
    ignoreKeypressListener,
    setIgnoreKeypress,
    setEntityType,
    entityType,
    highlightTerm,
    setHighlightTerm,
    selectedTag,
    setSelectedTag,
    setSelectedTabsetId,
    selectedTabsetId,
    tabsFilter,
    setListDetailLevel,
    listDetailLevel,
    listDetailLevelGreaterEqual,
    dbReady,
    sidePanel,
    sidePanelSetActiveView,
    sidePanelIsActive,
    sidePanelActiveViewIs,
    toggleLeftDrawer,
    progress,
    progressLabel,
    tabsetsExpanded
  }
})
