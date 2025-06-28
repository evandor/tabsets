import _ from 'lodash'
import { defineStore } from 'pinia'
import { useSpacesStore } from 'src/spaces/stores/spacesStore'
import { TabAndTabsetId } from 'src/tabsets/models/TabAndTabsetId'
import { Tabset, TabsetStatus } from 'src/tabsets/models/Tabset'
import { LocalStorageTabsetsPersistence } from 'src/tabsets/persistence/LocalStorageTabsetsPersistence'
import { useTabsetsStore } from 'src/tabsets/stores/tabsetsStore'
import { useTabsStore2 } from 'src/tabsets/stores/tabsStore2'
import { ref } from 'vue'

export const useTabsetsUiStore = defineStore('tabsetsUi', () => {
  const lastUpdate = ref(0)

  const matchingTabs = ref<TabAndTabsetId[]>([])
  const lastUsedTabsets = ref<string[]>([])
  const favorites = ref<string[]>([])

  let storage = null as unknown as LocalStorageTabsetsPersistence

  async function initialize(persistence: LocalStorageTabsetsPersistence) {
    // console.debug(` ...initializing tabsetsUiStore})`)
    storage = persistence
    load()
    lastUpdate.value = new Date().getTime()
  }

  function setMatchingTabsFor(url: string | undefined) {
    if (url) {
      const tabAndTabsetIds = useTabsetsStore().tabsForUrl(url)
      matchingTabs.value = tabAndTabsetIds
    }
  }

  function addTabsetToLastUsedList(id: string) {
    const spaceId: string | undefined = useSpacesStore().space?.id || undefined
    let lastUsedList: string[] = storage.getLastUsedTabsets(spaceId)
    if (lastUsedList.indexOf(id) < 0) {
      lastUsedList.push(id)
      const nonFavorites = _.difference(lastUsedList, favorites.value)
      if (nonFavorites.length > 3) {
        nonFavorites.splice(0, 1)
      }
      lastUsedList = _.union(nonFavorites, favorites.value)
      storage.updateLastUsedTabsets(spaceId, lastUsedList)
      lastUpdate.value = new Date().getTime()
      lastUsedTabsets.value = lastUsedList
    }
  }

  function clearFromLastUsedTabsets(spaceId: string | undefined, tabsetId: string) {
    const lastUsedList: string[] = storage.getLastUsedTabsets(spaceId)
    const foundIndex = lastUsedList.indexOf(tabsetId)
    if (foundIndex >= 0) {
      lastUsedList.splice(foundIndex, 1)
      storage.updateLastUsedTabsets(spaceId, lastUsedList)
      lastUpdate.value = new Date().getTime()
      lastUsedTabsets.value = lastUsedList
    }
  }

  function favoriteForCurrentSpace(spaceId: string | undefined, ts: Tabset) {
    if (spaceId) {
      if (ts.spaces.indexOf(spaceId) < 0) {
        return false
      }
    } else {
      if (ts.spaces.length > 0) {
        return false
      }
    }
    return ts.status == TabsetStatus.FAVORITE
  }

  function load() {
    const spaceId: string | undefined = useSpacesStore().space?.id || undefined
    lastUsedTabsets.value = storage.getLastUsedTabsets(spaceId)

    favorites.value = ([...useTabsetsStore().tabsets.values()] as Tabset[])
      .filter((ts: Tabset) => favoriteForCurrentSpace(spaceId, ts))
      .map((ts: Tabset) => ts.id)

    lastUsedTabsets.value = _.union(lastUsedTabsets.value, favorites.value)
  }

  function updateExtensionIcon(tabId?: number) {
    const currentBrowserTab = useTabsStore2().currentChromeTab
    const currentUrl = currentBrowserTab?.url
    if (currentUrl) {
      // console.log('updating extension icon', currentUrl, tabId)
      chrome.action.setBadgeText({ text: '' })
      chrome.action.setTitle({ title: 'Tabsets' })
      setMatchingTabsFor(currentUrl)
      if (matchingTabs.value.length > 0) {
        chrome.action.setBadgeText({ tabId, text: '' + matchingTabs.value.length })
        chrome.action.setBadgeBackgroundColor({ tabId, color: 'orange' })
        chrome.action.setTitle({ tabId, title: `The current tab is contained in ${matchingTabs.value.length} tabsets` })
        useTabsetsStore()
          .getCurrentTabsetId()
          .then((currentTabsetId: string | undefined) => {
            if (currentTabsetId) {
              // console.log('updating extension icon II', currentTabsetId, matchingTabs.value)
              if (matchingTabs.value.map((ts: TabAndTabsetId) => ts.tabsetId).indexOf(currentTabsetId || '') >= 0) {
                // console.log('updating extension icon III', tabId)
                chrome.action.setBadgeBackgroundColor({ tabId, color: 'green' })
                chrome.action.setTitle({
                  tabId,
                  title: `The current tab is contained in ${matchingTabs.value.length} tabsets, including the current one (${useTabsetsStore().currentTabsetName}).`,
                })
              }
            }
          })
      } else {
        if (process.env.TABSETS_STAGE === 'DEV') {
          chrome.action.setBadgeText({ tabId, text: 'D' })
        }
      }
    }
  }

  return {
    initialize,
    setMatchingTabsFor,
    matchingTabs,
    addTabsetToLastUsedList,
    lastUsedTabsets,
    lastUpdate,
    clearFromLastUsedTabsets,
    load,
    updateExtensionIcon,
  }
})
