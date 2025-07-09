import _ from 'lodash'
import { defineStore } from 'pinia'
import { LocalStorage } from 'quasar'
import sanitizeAsText from 'sanitize-html'
import { SidePanel } from 'src/app/models/SidePanel'
import { SidePanelViews } from 'src/app/models/SidePanelViews'
import { SHARING_AUTHOR_IDENT, SHARING_AVATAR_IDENT } from 'src/boot/constants'
import { Toast, ToastType } from 'src/core/models/Toast'
import { useUtils } from 'src/core/services/Utils'
import { AnimationIdentifier } from 'src/ui/models/Animations'
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'

export enum DrawerTabs {
  BOOKMARKS = 'bookmarks',
  OPEN_TABS = 'openTabs',
  SESSIONS = 'sessions',
  UNASSIGNED_TABS = 'unassignedTabs',
  GROUP_BY_HOST_TABS = 'groupedByHostTabs',
  SAVED_TABS = 'savedTabs',
  SAVED_TABS_AS_PDF = 'savedTabsPdf',
  SAVED_TABS_AS_PNG = 'savedTabsPng',
  RSS = 'rss',
  SCHEDULED = 'scheduled',
  HISTORY = 'history',
  FEATURES = 'features',
  TAB_DETAILS = 'tabDetails',
  TABSET_DETAILS = 'tabsetDetails',
  NEW_TAB_URLS = 'newTabUrls',
  TAGS_VIEWER = 'tagsViewer',
  TAG_VIEWER = 'tagViewer',
  HELP = 'help',
}

export type ListDetailLevel = 'MINIMAL' | 'SOME' | 'MAXIMAL' | 'DEFAULT'

export type QuickAccess = 'search'

export enum FontSize {
  SMALLER = 'SMALLER',
  SMALL = 'SMALL',
  DEFAULT = 'DEFAULT',
  LARGE = 'LARGE',
  LARGER = 'LARGER',
}

export type UiDensity = 'dense' | 'thin'
export type FolderAppearance = 'expand' | 'goInto'
export type ToolbarIntegration = 'none' | 'tabsets' | 'all'

export class RightDrawer {
  constructor(public activeTab: DrawerTabs = DrawerTabs.OPEN_TABS) {}
}

export const useUiStore = defineStore('ui', () => {
  const router = useRouter()

  const { sendMsg } = useUtils()

  const selectedTag = ref<string | undefined>(undefined)
  const tabsetsExpanded = ref<boolean>(false)
  const syncing = ref<boolean>(false)
  const saving = ref<boolean>(false)
  const appLoading = ref<string | undefined>(undefined)
  const bookmarksLoading = ref<boolean>(false)
  const pageCaptureLoading = ref<boolean>(false)
  const aiLoading = ref<boolean>(false)
  const progress = ref<object | undefined>(undefined)
  const commandExecuting = ref(false)
  const watermark = ref('')
  const warningCount = ref(0)
  const errorCount = ref(0)
  const showTabsetList = ref(true)

  // online offline
  const networkOnline = ref(navigator.onLine)
  const networkState = ref<object>({})

  // RightDrawer
  let rightDrawer = ref<RightDrawer>(new RightDrawer())
  //let rightDrawerOpen = ref($q ? $q.screen.gt.md : true)
  let rightDrawerOpen = ref(false)
  let leftDrawerOpen = ref(true)

  // SidePanel
  let sidePanel = ref<SidePanel>(new SidePanel())
  const animateNewTabsetButton = ref(false)
  const animateSettingsButton = ref(false)
  const animateAddtabButton = ref(false)
  const animateMenuButton = ref(false)
  const animateBookmarksButton = ref(false)
  const animateTabsListButton = ref(false)

  const showLoginTable = ref(false)

  const highlightTerm = ref<string | undefined>(undefined)

  const newTabsetEmptyByDefault = ref<boolean>(
    (LocalStorage.getItem('ui.newTabsetEmptyByDefault') as unknown as boolean) || false,
  )
  const tabBeingDragged = ref<string | undefined>(undefined)
  const dragEvent = ref<DragEvent | undefined>(undefined)
  const footerInfo = ref<string | undefined>(undefined)

  const contentCount = ref<number>(0)

  const fontsize = ref<FontSize>(LocalStorage.getItem('ui.fontsize') || FontSize.DEFAULT)
  const uiDensity = ref<UiDensity>(LocalStorage.getItem('ui.density') || 'thin')
  const folderStyle = ref<FolderAppearance>(LocalStorage.getItem('ui.folder.style') || 'goInto')

  const listDetailLevel = ref<ListDetailLevel>(LocalStorage.getItem('ui.detailLevel') || 'MINIMAL')
  const showFullUrls = ref<boolean>(LocalStorage.getItem('ui.fullUrls') || false)
  const overlapIndicator = ref<boolean>(LocalStorage.getItem('ui.overlapIndicator') || false)
  const contentScriptLoggingOff = ref<boolean>(LocalStorage.getItem('ui.contentScriptLoggingOff') || false)
  // const showDetailsPerTabset = ref<boolean>(LocalStorage.getItem('ui.detailsPerTabset') || false)

  // info Messages
  const hiddenMessages = ref<string[]>((LocalStorage.getItem('ui.hiddenInfoMessages') as unknown as string[]) || [])
  const messageAlreadyShown = ref<string | undefined>(undefined)

  const toasts = ref<Toast[]>([])
  const toastTimeouts = ref<NodeJS.Timeout[]>([])

  // highlight url(s) feature
  const highlightUrls = ref<string[]>([])

  // new tab feature
  const newTabUrlList = ref<object[]>((LocalStorage.getItem('ui.newTabUrlList') as unknown as object[]) || [])

  // listener currently triggered on '/' keypress for search keyboard shortcut
  const ignoreKeypress = ref(false)

  // entity management
  const entityType = ref<string | undefined>(undefined)
  const selectedTabsetId = ref<string | undefined>(undefined)

  // system management
  const dbReady = ref<boolean>(false)
  const dbSyncing = ref<boolean>(false)

  const showCurrentTabBox = ref<boolean>(true)

  const toolbarFilter = ref(false)
  const toolbarFilterTerm = ref('')

  // tabset description
  const tabsetDescriptionPanelHights = ref<object>(
    (LocalStorage.getItem('ui.descriptionPanelHeights') as unknown as object) || {},
  )

  const sharingAuthor = ref<string>((LocalStorage.getItem(SHARING_AUTHOR_IDENT) as unknown as string) || '')

  // still used?
  const sharingAvatar = ref<string>((LocalStorage.getItem(SHARING_AVATAR_IDENT) as unknown as string) || '')

  // info e.g. when stopping to sync
  const showSwitchedToLocalInfo = ref<boolean>(false)

  const importedBookmarks = ref<string[]>([])

  // quick access
  const quickAccess = ref<string[]>((LocalStorage.getItem('ui.quickAccess') as unknown as string[]) || [])
  const quickAccessLastChange = ref(new Date().getTime())

  watch(
    rightDrawer.value,
    (val: Object) => {
      LocalStorage.set('ui.rightDrawer', val)
    },
    { deep: true },
  )

  watch(newTabsetEmptyByDefault, (val: Object) => {
    LocalStorage.set('ui.newTabsetEmptyByDefault', val)
  })

  watch(newTabUrlList, (val: object[]) => {
    console.log('newTabUrlList', val)
    LocalStorage.set('ui.newTabUrlList', val)
  })

  watch(newTabUrlList.value, (val: object[]) => {
    console.log('val', val)
    LocalStorage.set('ui.newTabUrlList', val)
  })

  watch(tabsetDescriptionPanelHights.value, (val: object) => {
    LocalStorage.set('ui.descriptionPanelHeights', val)
  })

  watch(sharingAuthor, (val: string | undefined) => {
    console.log('val', val)
    LocalStorage.set(SHARING_AUTHOR_IDENT, val ? sanitizeAsText(val) : undefined)
  })

  watch(sharingAvatar, (val: string | undefined) => {
    console.log('val', val)
    LocalStorage.set(SHARING_AVATAR_IDENT, val)
  })

  const route = useRoute()
  watch(
    route,
    (to) => {
      // console.log("resetting", messageAlreadyShown.value)
      setAnotherMessageAlreadyShown(undefined)
    },
    { flush: 'pre', immediate: true, deep: true },
  )

  watch(
    hiddenMessages,
    (thresholdsVal: Object) => {
      LocalStorage.set('ui.hiddenInfoMessages', thresholdsVal)
    },
    { deep: true },
  )

  watch(
    quickAccess,
    (val: String[]) => {
      LocalStorage.set('ui.quickAccess', val)
    },
    { deep: true },
  )

  function checkConnection() {
    console.log('testing nav connection')
    // @ts-expect-error TODO
    var conn = navigator.connection
    if (!conn) {
      console.log('no navigator connection information available')
    } else {
      console.log(`Effective network type: ${conn.effectiveType}`)
      console.log(`Downlink Speed: ${conn.downlink}Mb/s`)
      console.log(`Round Trip Time: ${conn.rtt}ms`)
      networkState.value = {
        type: conn.effectiveType,
        speed: conn.downlink,
        rtt: conn.rtt,
      }
    }
  }

  function draggingTab(tabId: string, evt: DragEvent, doSendMessage = false) {
    tabBeingDragged.value = tabId
    dragEvent.value = evt
    if (doSendMessage) {
      sendMsg('tab-being-dragged', {
        tabId: tabId,
      })
    }
  }

  function droppingTab() {
    console.log('dropping tab', tabBeingDragged.value)
    const tabBeingDropped = tabBeingDragged.value
    tabBeingDragged.value = undefined
    dragEvent.value = undefined
    return tabBeingDropped
  }

  function setSelectedTag(tag: string) {
    selectedTag.value = tag
  }

  function hideInfoMessage(ident: string) {
    hiddenMessages.value.push(ident)
  }

  function restoreHints() {
    console.log('hiddenMessages.value', hiddenMessages.value)
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

  function sidePanelSetActiveView(view: SidePanelViews) {
    sidePanel.value.activeView = view
    router.push(view.path)
  }

  const sidePanelActiveViewIs = computed(() => {
    return (viewToCompare: SidePanelViews) => {
      return sidePanel.value.activeView?.ident === viewToCompare.ident
    }
  })

  function setHighlightTerm(term: string | undefined) {
    highlightTerm.value = term
  }

  function setListDetailLevel(val: ListDetailLevel) {
    listDetailLevel.value = val
  }

  function setShowFullUrls(val: boolean) {
    showFullUrls.value = val
  }

  function setOverlapIndicator(val: boolean) {
    overlapIndicator.value = val
  }

  function setContentScriptLoggingOff(val: boolean) {
    contentScriptLoggingOff.value = val
  }

  function setFontsize(val: FontSize) {
    fontsize.value = val
    if (val) {
      switch (val) {
        case FontSize.SMALLER:
          document.body.style.setProperty('font-size', '12px')
          break
        case FontSize.SMALL:
          document.body.style.setProperty('font-size', '14px')
          break
        case FontSize.LARGE:
          document.body.style.setProperty('font-size', '20px')
          break
        case FontSize.LARGER:
          document.body.style.setProperty('font-size', '24px')
          break
        default:
          document.body.style.setProperty('font-size', '16px')
      }
    }
  }

  function setUiDensity(val: UiDensity) {
    uiDensity.value = val
    if (val) {
      switch (val) {
        case 'dense':
          //useUiStore().setUi
          break
        case 'thin':
          //document.body.style.setProperty('font-size', '14px')
          break
        default:
        //document.body.style.setProperty('font-size', '16px')
      }
    }
  }

  function setFolderStyle(val: FolderAppearance) {
    folderStyle.value = val
  }

  function setWatermark(text: string) {
    watermark.value = text
  }

  const listDetailLevelGreaterEqual = computed(() => {
    return (
      thresholdLevel: ListDetailLevel,
      tabsetDetailLevel: ListDetailLevel | undefined = undefined,
      forceLevel: ListDetailLevel | undefined = undefined,
    ): boolean => {
      // console.log(`>>> Thres. ${thresholdLevel}, forced: ${forceLevel}, from tabset: ${tabsetDetailLevel}`)
      let useLevel = forceLevel ? forceLevel : listDetailLevel.value
      if (!forceLevel && tabsetDetailLevel) {
        useLevel = tabsetDetailLevel
        if (tabsetDetailLevel === 'DEFAULT') {
          useLevel = listDetailLevel.value
        }
      }
      // console.log('useLevel', useLevel)
      switch (useLevel) {
        case 'MAXIMAL':
          return true
        case 'SOME':
          return thresholdLevel === 'SOME' || thresholdLevel === 'MINIMAL'
        case 'MINIMAL':
          return thresholdLevel === 'MINIMAL'
        case 'DEFAULT':
          return true
      }
    }
  })

  const listDetailLevelEquals = computed(() => {
    return (level: ListDetailLevel, tabsetDetail: ListDetailLevel | undefined) => {
      let useLevel = tabsetDetail ? tabsetDetail : listDetailLevel.value
      return useLevel === level
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
    return (view: SidePanelViews) => sidePanel.value.activeView?.ident === view.ident
  })

  const getContentCount = computed((): number => contentCount.value)

  // function setSelectedTab(tab: Tab) {
  //   console.log("setting selected tab", tab)
  //   selectedTab.value = tab
  // }

  // const getSelectedTab = computed(():Tab | undefined => {
  //   return selectedTab.value as Tab | undefined
  // })

  // highlight url(s) feature
  function clearHighlights() {
    highlightUrls.value = []
  }

  function addHighlight(url: string) {
    highlightUrls.value.push(url)
  }

  const getHighlightUrls = computed(() => highlightUrls.value)

  function setIgnoreKeypress(b: boolean) {
    ignoreKeypress.value = b
  }

  function toggleLeftDrawer() {
    leftDrawerOpen.value = !leftDrawerOpen.value
  }

  function toggleToolbarFilter() {
    toolbarFilter.value = !toolbarFilter.value
    if (!toolbarFilter.value) {
      toolbarFilterTerm.value = ''
    }
  }

  function createSuccessToast(msg: string, actions: any[] = []) {
    toastTimeouts.value.forEach((timeout: NodeJS.Timeout) => clearTimeout(timeout))
    toasts.value.push(new Toast(msg, ToastType.INFO, actions))
  }

  function createUserChoiceToast(msg: string, actions: any[] = []) {
    toastTimeouts.value.forEach((timeout: NodeJS.Timeout) => clearTimeout(timeout))
    toasts.value.push(new Toast(msg, ToastType.CHOICE, actions))
  }

  function createWarningToast(msg: string, action: any = undefined) {
    toastTimeouts.value.forEach((timeout: NodeJS.Timeout) => clearTimeout(timeout))
    toasts.value.push(new Toast(msg, ToastType.WARNING, action))
  }

  function createErrorToast(msg: string) {
    toastTimeouts.value.forEach((timeout: NodeJS.Timeout) => clearTimeout(timeout))
    toasts.value.push(new Toast(msg, ToastType.ERROR))
  }

  function removeToast(toast: Toast) {
    const index = _.findIndex(toasts.value, (t: Toast) => t.id === toast.id)
    if (index >= 0) {
      toasts.value.splice(index, 1)
    }
  }

  function delayedToastRemoval(delay: number = 3000) {
    if (toasts.value.length > 0) {
      const toast = toasts.value[0]
      const timeout = setTimeout(() => {
        removeToast(toast!)
      }, delay)
      toastTimeouts.value.push(timeout)
    }
  }

  function callUndoActionFromCurrentToast() {
    if (toasts.value.length > 0) {
      const toast = toasts.value[0]
      console.log('applying (first) undo/action method...')
      toast!.actions[0].handler.apply(null)
      removeToast(toast!)
    }
  }

  function getButtonSize(ident: string) {
    if (ident === 'sidePanelFooter') {
      const viewsCount = sidePanel.value.enabledViewsCount()
      const limit = Math.min(viewsCount, 7)
      return 16 - limit + 'px'
    }
    console.log('warning, using unknown ident', ident)
    return '19px'
  }

  function getWatermark() {
    return watermark.value
  }

  function setProgress(v: number, label: string | undefined = undefined) {
    const val = Math.max(0, Math.min(v, 1.0))
    progress.value = {
      val: val,
      label: label ? label : Math.round(100 * val) + '%',
    }
  }

  function stopProgress() {
    progress.value = undefined
  }

  function startButtonAnimation(name: AnimationIdentifier) {
    switch (name) {
      case 'newTabset':
        animateNewTabsetButton.value = true
        setTimeout(() => (animateNewTabsetButton.value = false), 2000)
        break
      case 'bookmarks':
        animateBookmarksButton.value = true
        setTimeout(() => (animateBookmarksButton.value = false), 2000)
        break
      case 'tabsList':
        animateTabsListButton.value = true
        setTimeout(() => (animateTabsListButton.value = false), 2000)
        break
      case 'settings':
        animateSettingsButton.value = true
        setTimeout(() => (animateSettingsButton.value = false), 2000)
        break
      case 'addtab':
        animateAddtabButton.value = true
        setTimeout(() => (animateAddtabButton.value = false), 2000)
        break
      case 'menu':
        animateMenuButton.value = true
        setTimeout(() => (animateMenuButton.value = false), 2000)
        break
      default:
        console.log('unrecognized element name', name)
    }
  }

  function hideTabsetList(hide: boolean) {
    showTabsetList.value = !hide
  }

  function setQuickAccess(type: QuickAccess, value: boolean) {
    quickAccessLastChange.value = new Date().getTime()
    if (value && quickAccess.value.indexOf(type) < 0) {
      quickAccess.value.push(type)
    } else if (!value) {
      quickAccess.value = quickAccess.value.filter((q: string) => q !== type)
    }
  }

  function quickAccessFor(type: QuickAccess) {
    return quickAccess.value.indexOf(type) >= 0
  }

  return {
    rightDrawer,
    rightDrawerOpen,
    leftDrawerOpen,
    rightDrawerSetActiveTab,
    draggingTab,
    droppingTab,
    newTabsetEmptyByDefault,
    hideInfoMessage,
    restoreHints,
    showMessage,
    footerInfo,
    getContentCount,
    newTabUrlList,
    clearHighlights,
    addHighlight,
    getHighlightUrls,
    entityType,
    highlightTerm,
    setHighlightTerm,
    selectedTag,
    setSelectedTag,
    selectedTabsetId,
    setListDetailLevel,
    setShowFullUrls,
    setOverlapIndicator,
    setContentScriptLoggingOff,
    listDetailLevel,
    showFullUrls,
    overlapIndicator,
    contentScriptLoggingOff,
    listDetailLevelGreaterEqual,
    listDetailLevelEquals,
    dbReady,
    dbSyncing,
    sidePanel,
    sidePanelSetActiveView,
    sidePanelIsActive,
    sidePanelActiveViewIs,
    toggleLeftDrawer,
    tabsetsExpanded,
    showCurrentTabBox,
    toolbarFilter,
    toolbarFilterTerm,
    toasts,
    createSuccessToast,
    createWarningToast,
    createErrorToast,
    createUserChoiceToast,
    delayedToastRemoval,
    callUndoActionFromCurrentToast,
    getButtonSize,
    sharingAuthor,
    sharingAvatar,
    networkOnline,
    tabBeingDragged,
    appLoading,
    bookmarksLoading,
    pageCaptureLoading,
    aiLoading,
    progress,
    setProgress,
    stopProgress,
    animateNewTabsetButton,
    animateSettingsButton,
    animateBookmarksButton,
    animateTabsListButton,
    animateAddtabButton,
    animateMenuButton,
    startButtonAnimation,
    showSwitchedToLocalInfo,
    syncing,
    saving,
    commandExecuting,
    checkConnection,
    networkState,
    fontsize,
    setFontsize,
    setUiDensity,
    uiDensity,
    folderStyle,
    setFolderStyle,
    importedBookmarks,
    getWatermark,
    setWatermark,
    warningCount,
    errorCount,
    hideTabsetList,
    showTabsetList,
    setQuickAccess,
    quickAccessFor,
    quickAccessLastChange,
  }
})
