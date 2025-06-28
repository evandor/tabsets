import _ from 'lodash'
import { defineStore } from 'pinia'
import { LocalStorage, uid } from 'quasar'
import { useContentStore } from 'src/content/stores/contentStore'
import { useUtils } from 'src/core/services/Utils'
import { Suggestion } from 'src/suggestions/domain/models/Suggestion'
import { useSuggestionsStore } from 'src/suggestions/stores/suggestionsStore'
import { Tab } from 'src/tabsets/models/Tab'
import { TabAndTabsetId } from 'src/tabsets/models/TabAndTabsetId'
import { ChangeInfo, Tabset } from 'src/tabsets/models/Tabset'
import { useTabsetService } from 'src/tabsets/services/TabsetService2'
import { useTabsetsStore } from 'src/tabsets/stores/tabsetsStore'
import { useTabsetsUiStore } from 'src/tabsets/stores/tabsetsUiStore'
import { computed, ComputedRef, ref } from 'vue'

async function queryTabs(): Promise<chrome.tabs.Tab[]> {
  return await chrome.tabs.query({ currentWindow: true })
}

function calcOverlapForTabsets(
  tabsets: Tabset[],
  getOverlap: ComputedRef<(tabset: Tabset) => number>,
  maxOverlap: number,
  maxOverlapTs: Tabset | undefined,
  maxOverlapFolder: Tabset | undefined,
  level: number = 0,
) {
  tabsets.forEach((ts: Tabset) => {
    const overlap = getOverlap.value(ts)
    if (overlap > maxOverlap) {
      // console.log('overlap!!!', overlap, ts.name)
      maxOverlap = overlap
      maxOverlapTs = level == 0 ? ts : maxOverlapTs
      maxOverlapFolder = level == 0 ? undefined : ts
    }
    const folderRes = calcOverlapForTabsets(ts.folders, getOverlap, maxOverlap, maxOverlapTs, maxOverlapFolder, level++)
    if (folderRes && folderRes.maxOverlap > maxOverlap) {
      // console.log('overlap!!!', overlap, folderRes.maxOverlapFolder?.name)
      maxOverlap = folderRes.maxOverlap
      maxOverlapTs = folderRes.maxOverlapTs
      maxOverlapFolder = folderRes.maxOverlapFolder
    }
  })
  return { maxOverlap, maxOverlapTs, maxOverlapFolder }
}

/**
 * a pinia store for "browsertabs".
 */
export const useTabsStore2 = defineStore('browsertabs', () => {
  const { inBexMode, addListenerOnce } = useUtils()

  // === listeners ===
  const onTabActivatedListener = (activeInfo: chrome.tabs.TabActiveInfo) => onTabActivated(activeInfo)

  const onTabUpdatedListener = (tabId: number, changeInfo: chrome.tabs.TabChangeInfo, tab: chrome.tabs.Tab) =>
    onTabUpdated(tabId, changeInfo, tab)

  const onTabRemovedListener = (tabId: number, removeInfo: chrome.tabs.TabRemoveInfo) => onTabRemoved(tabId, removeInfo)
  const onTabMovedListener = (tabId: number, removeInfo: chrome.tabs.TabMoveInfo) => onTabMoved(tabId, removeInfo)

  const onWindowFocusChangedListener = (windowId: number) => onWindowFocusChanged(windowId)

  // === state ===
  // browser's current windows tabs, reloaded on various events
  const browserTabs = ref<chrome.tabs.Tab[]>([])

  const currentChromeTab = ref<chrome.tabs.Tab | undefined>(undefined)

  // tab by window id
  const currentChromeTabs = ref<Map<number, chrome.tabs.Tab>>(new Map())

  // the ids of the tabs the user activated, limited to the last X entries
  // const chromeTabsHistory = new Array<[number, string]>()
  const chromeTabsHistory = ref<[number, string][]>([]) //new Array<[number, string]>()

  // where are we in the chromeTabsHistory?
  const chromeTabsHistoryPosition = ref(-1)

  // we are currently navigating through the history?
  const chromeTabsHistoryNavigating = ref(false)

  // timers (reading time)
  let timer: { time: number; start: number; url: string } = { time: 0, start: new Date().getTime(), url: '' }
  const timers = new Map<string, number>()

  // *** actions ***

  /**
   * initialize store with
   * @param ps a persistence storage
   */
  async function initialize() {
    if (inBexMode()) {
      //console.log('initializing tabsStore2')
      browserTabs.value = await queryTabs()
      await setCurrentTab()

      // eslint-disable-next-line @typescript-eslint/no-misused-promises
      addListenerOnce(chrome.tabs.onActivated, onTabActivatedListener)
      // eslint-disable-next-line @typescript-eslint/no-misused-promises
      addListenerOnce(chrome.tabs.onUpdated, onTabUpdatedListener)
      // eslint-disable-next-line @typescript-eslint/no-misused-promises
      addListenerOnce(chrome.tabs.onRemoved, onTabRemovedListener)
      // eslint-disable-next-line @typescript-eslint/no-misused-promises
      addListenerOnce(chrome.tabs.onMoved, onTabMovedListener)

      addListenerOnce(chrome.windows.onFocusChanged, onWindowFocusChangedListener)
    }
  }

  function stopTimers() {
    timer = { time: 0, start: new Date().getTime(), url: '' }
  }

  async function stopTimer(url: string) {
    const duration = new Date().getTime() - timer.start
    //console.log(`stopping timer for ${url}: ${timer.time} + ${duration}`)
    const tabsForUrl: TabAndTabsetId[] = useTabsetsStore().tabsForUrl(url)
    for (const tabWithTsId of tabsForUrl) {
      //console.log('found', tabWithTsId)
      tabWithTsId.tab.readingTime += Math.min(duration, 60000)
      const ts = useTabsetsStore().getTabset(tabWithTsId.tabsetId)
      if (ts) {
        //console.log('saving', ts)
        await useTabsetService().saveTabset(
          ts,
          new ChangeInfo('tab', 'edited', tabWithTsId.tab.id, tabWithTsId.tab.url),
        )
      }
    }
    if (tabsForUrl.length === 0) {
      timers.set(url, timer.time + duration)
    }
    //console.log('timers', timers)
  }

  function startTimer(url: string | undefined) {
    if (url) {
      if (timer.url !== url) {
        stopTimer(timer.url) // stop 'old' timer
      }
      timer = { start: new Date().getTime(), url: url, time: timers.get(url) || 0 }
      //console.log('started timer', timer)
    }
  }

  async function onTabActivated(activeInfo: chrome.tabs.TabActiveInfo) {
    console.log(`tabActivated: ${JSON.stringify(activeInfo)}`)
    const tab: chrome.tabs.Tab = await chrome.tabs.get(activeInfo.tabId)
    useTabsetsUiStore().updateExtensionIcon(tab)
    await useContentStore().resetFor(tab)
    useTabsetService().urlWasActivated(tab.url)
    useTabsetsUiStore().setMatchingTabsFor(tab.url)
    startTimer(tab.url)
  }

  async function checkSwitchTabsetSuggestion(windowId: number) {
    if (!LocalStorage.getItem('ui.overlapIndicator')) {
      return Promise.resolve()
    }
    const suggestedTabsetAndFolder = await useTabsStore2().suggestTabsetAndFolder(0.6)
    if (suggestedTabsetAndFolder) {
      console.log('suggestedTabsetAndFolder', suggestedTabsetAndFolder)
      const suggestion = new Suggestion(
        uid(), //'SWITCH_TABSET',
        'Switch Tabset?',
        'Your currently open tabs match a different tabset: ' +
          suggestedTabsetAndFolder?.tabsetName +
          '. Do you want to switch to this tabset?',
        'tabset://' + suggestedTabsetAndFolder?.tabsetId + '/' + suggestedTabsetAndFolder?.folder,
        'SWITCH_TABSET',
      )
      //  .setImage('o_tab')
      // .setState('PRIO')
      //  .setWindowId(windowId)
      suggestion.applyLabel = 'switch'
      suggestion.windowId = windowId
      await useSuggestionsStore().addSuggestion(suggestion)
    }
  }

  // #region snippet
  async function onTabUpdated(number: number, info: chrome.tabs.TabChangeInfo, chromeTab: chrome.tabs.Tab) {
    if (info.status !== 'complete') {
      return
    }
    console.log(`tabUpdate (complete): ${chromeTab.url?.substring(0, 30)}, ${JSON.stringify(info)}`)
    browserTabs.value = await queryTabs()
    await setCurrentTab()

    useTabsetsUiStore().setMatchingTabsFor(chromeTab.url)
    useTabsetService().urlWasActivated(chromeTab.url)
    useTabsetsUiStore().updateExtensionIcon(chromeTab)

    await checkSwitchTabsetSuggestion(chromeTab.windowId)
  }

  // #endregion snippet

  async function onTabRemoved(tabId: number, removeInfo: chrome.tabs.TabRemoveInfo) {
    // console.log(`tabRemoved tabId: ${tabId}, windowId: ${removeInfo.windowId}`)
    browserTabs.value = await queryTabs()
  }

  async function onTabMoved(tabId: number, moveInfo: chrome.tabs.TabMoveInfo) {
    console.log('onTabMoved', tabId, moveInfo)
    browserTabs.value = await queryTabs()
  }

  function onWindowFocusChanged(windowId: number) {
    if (windowId === chrome.windows.WINDOW_ID_NONE) {
      stopTimers()
    }
  }

  //async function loadTabs(eventName: string) {}

  function setCurrentChromeTab(tab: chrome.tabs.Tab) {
    //console.log(`setting currentChromeTab to ${JSON.stringify(tab)}`)

    currentChromeTab.value = tab
    currentChromeTabs.value.set(tab.windowId, tab)
    const MAX_HISTORY_LENGTH = 12

    // tab was activated without using the navigation
    if (tab.id && !chromeTabsHistoryNavigating.value) {
      // update urls for matching id
      chromeTabsHistory.value.forEach(([tabId, url], index) => {
        if (tabId === tab.id) {
          chromeTabsHistory.value[index] = [tabId, tab.url || '']
        }
      })

      const historyLength = chromeTabsHistory.value.length
      chromeTabsHistoryPosition.value = Math.min(MAX_HISTORY_LENGTH - 1, historyLength)
      if (
        historyLength > 0 &&
        chromeTabsHistory.value[historyLength - 1]![0] !== tab.id &&
        chromeTabsHistory.value[historyLength - 1]![1] !== tab.url
      ) {
        chromeTabsHistory.value.push([tab.id, tab.url || ''])
      } else if (historyLength === 0) {
        chromeTabsHistory.value.push([tab.id, tab.url || ''])
      } else {
        //console.log("did not add, adjusting position", historyLength - 1)
        chromeTabsHistoryPosition.value = historyLength - 1
      }
      if (chromeTabsHistory.value.length > MAX_HISTORY_LENGTH) {
        // console.log("deleting first element")
        chromeTabsHistory.value.splice(0, 1)
      }
    } else if (chromeTabsHistoryNavigating.value) {
      chromeTabsHistoryNavigating.value = false
    }
  }

  function tabHistoryBack() {
    if (chromeTabsHistoryPosition.value > 0) {
      console.log('called tabHistoryBack with', chromeTabsHistoryPosition.value)
      chromeTabsHistoryPosition.value -= 1
      chromeTabsHistoryNavigating.value = true
    }
    return chromeTabsHistory.value[chromeTabsHistoryPosition.value]
  }

  function tabHistoryForward() {
    if (chromeTabsHistoryPosition.value < chromeTabsHistory.value.length - 1) {
      console.log('called tabHistoryForward with', chromeTabsHistoryPosition.value, chromeTabsHistory.value.length)
      chromeTabsHistoryPosition.value += 1
      chromeTabsHistoryNavigating.value = true
    }
    return chromeTabsHistory.value[chromeTabsHistoryPosition.value]
  }

  function removeTab(tabset: Tabset, tabId: string) {
    tabset.tabs = _.filter(tabset.tabs, (t: Tab) => t.id !== tabId)
    // markDuplicates(tabset)
    // if (this.pendingTabset) {
    //   this.pendingTabset.tabs = _.filter(this.pendingTabset.tabs as Tab[], (t: Tab) => t.id !== tabId)
    // }
    for (const folder of tabset.folders || []) {
      removeTab(folder, tabId)
    }
  }

  // *** getters ***
  const tabsCount = computed(() => {
    return browserTabs.value.length
  })

  // TODO needed?
  const getChromeTabs = computed(() => {
    return browserTabs.value
  })

  const getCurrentChromeTab = computed(() => {
    return (windowId: number): chrome.tabs.Tab | undefined => {
      return currentChromeTabs.value.get(windowId)
    }
  })

  const getOverlap = computed(() => {
    return (tabset: Tabset): number => {
      const currentTabsetTabs: Set<string> = new Set(tabset.tabs.map((t: Tab) => t.url || ''))
      const browserTabs: Set<string> = new Set(useTabsStore2().browserTabs.map((t: chrome.tabs.Tab) => t.url || ''))
      try {
        const allTabs = currentTabsetTabs.union(browserTabs)
        const lapover1 = currentTabsetTabs.intersection(allTabs)
        const lapover2 = browserTabs.intersection(allTabs)
        const overlap = Math.min(lapover1.size, lapover2.size) / allTabs.size
        //console.log('overlap', overlap, tabset.name, lapover1.size, lapover2.size, allTabs.size)
        //overlapTooltip.value = `${Math.round(100 * overlap.value)}% overlap between this tabset and the currently open tabs`
        return overlap
      } catch (err) {
        console.log('could not determine overlap', err)
        return 0
      }
    }
  })

  const suggestTabsetAndFolder = async (
    threshold: number,
  ): Promise<{ tabsetId: string; tabsetName: string; folder: string | undefined } | undefined> => {
    const currentTabset: Tabset | undefined = useTabsetsStore().getCurrentTabset
    if (currentTabset) {
      const currentOverlap = getOverlap.value(currentTabset)
      if (currentOverlap > threshold) {
        return undefined
      }
    }
    const tabsets = [...useTabsetsStore().tabsets.values()] as Tabset[]
    let maxOverlap = 0
    let maxOverlapTs: Tabset | undefined = undefined
    let maxOverlapFolder: Tabset | undefined = undefined

    const __ret = calcOverlapForTabsets(tabsets, getOverlap, maxOverlap, maxOverlapTs, maxOverlapFolder)
    maxOverlap = __ret.maxOverlap
    maxOverlapTs = __ret.maxOverlapTs
    maxOverlapFolder = __ret.maxOverlapFolder

    // console.log('---res-overlap---', maxOverlap, maxOverlapTs, maxOverlapFolder)

    if (maxOverlap > threshold && maxOverlapTs!.id !== (await useTabsetsStore().getCurrentTabsetId())) {
      //console.log('should switch to', maxOverlapTs!.name)
      return { tabsetId: maxOverlapTs!.id, tabsetName: maxOverlapTs!.name, folder: undefined }
    }
    return undefined
  }

  async function setCurrentTab(): Promise<chrome.tabs.Tab> {
    const tabs = await chrome.tabs.query({ active: true, lastFocusedWindow: true })
    if (chrome.runtime.lastError) {
      console.warn('got runtime error:' + JSON.stringify(chrome.runtime.lastError))
    }
    console.debug('setting current tab', tabs)
    if (tabs && tabs[0]) {
      setCurrentChromeTab(tabs[0] as unknown as chrome.tabs.Tab)
      return Promise.resolve(tabs[0])
    } else {
      // Seems to be necessary when creating a new chrome group
      const tabs2 = await chrome.tabs.query({ active: true })
      if (chrome.runtime.lastError) {
        console.warn('got runtime error:' + JSON.stringify(chrome.runtime.lastError))
      }
      //console.log("setting current tab II", tabs2)
      if (tabs2 && tabs2[0]) {
        setCurrentChromeTab(tabs2[0] as unknown as chrome.tabs.Tab)
        return Promise.resolve(tabs2[0])
      }
    }
    return Promise.reject('not able to determine current tab')
  }

  return {
    initialize,
    browserTabs,
    tabsCount,
    getChromeTabs,
    setCurrentChromeTab,
    getCurrentChromeTab,
    currentChromeTab,
    tabHistoryBack,
    tabHistoryForward,
    chromeTabsHistoryNavigating,
    chromeTabsHistoryPosition,
    chromeTabsHistory,
    removeTab,
    getOverlap,
    suggestTabsetAndFolder,
  }
})
