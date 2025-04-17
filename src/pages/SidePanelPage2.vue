<template>
  <!-- SidePanelPage2 -->
  <q-page class="darkInDarkMode brightInBrightMode" style="padding-top: 80px">
    <offline-info />

    <div class="wrap" v-if="useUiStore().appLoading">
      <div class="loading">
        <div class="bounceball q-mr-lg"></div>
        <div class="text">{{ useUiStore().appLoading }}</div>
      </div>
    </div>

    <!-- list of tabs, assuming here we have at least one tabset -->
    <div class="q-ma-none q-pa-none q-pt-xs">
      <template v-if="useTabsetsStore().tabsets.size > 0">
        <div class="row q-ma-none q-pa-none items-start darkInDarkMode brightInBrightMode">
          <SidePanelPageContent2
            v-if="currentTabset && useFolderExpansion === 'expand'"
            :tabset="currentTabset"
            :key="currentTabset.id"
            :filter="filter"
            @tabs-found="(n: number) => (filteredTabsCount = n)"
            @folders-found="(n: number) => (filteredFoldersCount = n)" />
          <SidePanelPageContent
            v-if="currentTabset && useFolderExpansion === 'goInto'"
            :tabset="currentTabset"
            :key="currentTabset?.id"
            :filter="filter"
            @tabs-found="(n: number) => (filteredTabsCount = n)"
            @folders-found="(n: number) => (filteredFoldersCount = n)" />
        </div>
      </template>

      <StartingHint v-if="showStartingHint()" />
    </div>

    <q-page-sticky expand position="top" class="darkInDarkMode brightInBrightMode">
      <FirstToolbarHelper2 :showSearchBox="showSearchBox" @tabset-changed="tabsetChanged()" />
      <SearchToolbarHelper
        v-if="useTabsetsStore().allTabsCount > 0"
        @on-term-changed="(val) => termChanged(val)"
        :filteredFoldersCount="filteredFoldersCount"
        :filteredTabsCount="filteredTabsCount" />
    </q-page-sticky>
  </q-page>
</template>

<script lang="ts" setup>
import _ from 'lodash'
import { useQuasar } from 'quasar'
import { FeatureIdent } from 'src/app/models/FeatureIdent'
import OfflineInfo from 'src/core/components/helper/offlineInfo.vue'
import { useUtils } from 'src/core/services/Utils'
import Analytics from 'src/core/utils/google-analytics'
import { useFeaturesStore } from 'src/features/stores/featuresStore'
import FirstToolbarHelper2 from 'src/pages/sidepanel/helper/FirstToolbarHelper2.vue'
import SearchToolbarHelper from 'src/pages/sidepanel/helper/SearchToolbarHelper.vue'
import SidePanelPageContent from 'src/pages/SidePanelPageContent.vue'
import SidePanelPageContent2 from 'src/pages/SidePanelPageContent2.vue'
import StartingHint from 'src/pages/widgets/StartingHint.vue'
import { useSpacesStore } from 'src/spaces/stores/spacesStore'
import { useAuthStore } from 'src/stores/authStore'
import { useSuggestionsStore } from 'src/suggestions/stores/suggestionsStore'
import { Tabset, TabsetStatus } from 'src/tabsets/models/Tabset'
import { useTabsetService } from 'src/tabsets/services/TabsetService2'
import { useTabsetsStore } from 'src/tabsets/stores/tabsetsStore'
import { useTabsStore2 } from 'src/tabsets/stores/tabsStore2'
import { FolderAppearance, useUiStore } from 'src/ui/stores/uiStore'
import { useWindowsStore } from 'src/windows/stores/windowsStore'
import { onMounted, onUnmounted, ref, watchEffect } from 'vue'
import { useRouter } from 'vue-router'

const { inBexMode } = useUtils()

const $q = useQuasar()
const router = useRouter()
const uiStore = useUiStore()

const filter = ref<string>('')
const showSearchBox = ref(false)
const tabsets = ref<Tabset[]>([])
const currentTabset = ref<Tabset | undefined>(undefined)
const currentChromeTab = ref<chrome.tabs.Tab | undefined>(undefined)
const tabsetsLastUpdate = ref(0)
const filteredTabsCount = ref(0)
const filteredFoldersCount = ref(0)
const useFolderExpansion = ref<FolderAppearance>(useUiStore().folderStyle)

function updateOnlineStatus(e: any) {
  const { type } = e
  useUiStore().networkOnline = type === 'online'
}

onMounted(() => {
  window.addEventListener('offline', (e) => updateOnlineStatus(e))
  window.addEventListener('online', (e) => updateOnlineStatus(e))

  if (!useAuthStore().isAuthenticated) {
    //router.push("/authenticate")
  } else {
    Analytics.firePageViewEvent('SidePanelPage2', document.location.href)
  }
})

watchEffect(() => {
  useFolderExpansion.value = useUiStore().folderStyle
})

watchEffect(() => {
  currentTabset.value = useTabsetsStore().getCurrentTabset
})

watchEffect(() => {
  tabsetsLastUpdate.value = useTabsetsStore().lastUpdate
})

const getTabsetOrder = [
  function (o: Tabset) {
    return !o || o.status === TabsetStatus.FAVORITE ? 0 : 1
  },
  function (o: Tabset) {
    return o.name?.toLowerCase()
  },
]

function determineTabsets() {
  return _.sortBy(
    _.filter(
      [...useTabsetsStore().tabsets.values()] as Tabset[],
      (ts: Tabset) =>
        ts.status !== TabsetStatus.DELETED && ts.status !== TabsetStatus.HIDDEN && ts.status !== TabsetStatus.ARCHIVED,
    ),
    getTabsetOrder,
    ['asc'],
  )
}

watchEffect(() => {
  if (useFeaturesStore().hasFeature(FeatureIdent.SPACES)) {
    const currentSpace = useSpacesStore().space
    tabsets.value = _.sortBy(
      _.filter([...useTabsetsStore().tabsets.values()] as Tabset[], (ts: Tabset) => {
        if (currentSpace) {
          if (ts.spaces.indexOf(currentSpace.id) < 0) {
            return false
          }
        }
        return (
          ts.status !== TabsetStatus.DELETED && ts.status !== TabsetStatus.HIDDEN && ts.status !== TabsetStatus.ARCHIVED
        )
      }),
      getTabsetOrder,
      ['asc'],
    )
    // console.log("tabsets:", tabsets.value)
  } else {
    tabsets.value = determineTabsets()
  }
})

watchEffect(() => {
  const windowId = useWindowsStore().currentBrowserWindow?.id || 0
  currentChromeTab.value = useTabsStore2().getCurrentChromeTab(windowId) || useTabsStore2().currentChromeTab
})

function inIgnoredMessages(message: any) {
  return message.msg === 'captureThumbnail' || message.name === 'reload-spaces'
}

const onMessageListener = (message: any, sender: any, sendResponse: (response?: any) => void) => {
  console.log(' <<< message', message)
  if (inIgnoredMessages(message)) {
    return true
  }
  if (message.name === 'current-tabset-id-change') {
    if (message.ignore) {
      return true
    }
    const tsId = message.data.tabsetId
    useTabsetsStore().selectCurrentTabset(tsId)
  } else if (message.name === 'feature-activated') {
    useFeaturesStore().activateFeature(message.data.feature)
  } else if (message.name === 'show-ignored') {
    console.log('hier')
    useTabsetsStore().selectCurrentTabset('IGNORED')
    router.push('/sidepanel')
  } else if (message.name === 'text-selection') {
    console.log('message', message)
  } else if (message.name === 'feature-deactivated') {
    useFeaturesStore().deactivateFeature(message.data.feature)
  } else if (message.name === 'tabsets-imported') {
    useSpacesStore().reload()
    useTabsetService().init()
    // TODO reload
  } else if (message.name === 'tab-being-dragged') {
    useUiStore().draggingTab(message.data.tabId, null as unknown as any)
  } else if (message.name === 'note-changed') {
    // TODO needed?
    //const tabset = useTabsetsStore().getTabset(message.data.tabsetId) as Tabset
    if (message.data.notebookId) {
      console.log('updating notebook/tabset', message.data.notebookId, message.data.tabsetId)
      useTabsetService().reloadTabset(message.data.tabsetId)
    } else {
      console.log('adding tab', message.data.tab)
      //tabset.tabs.push(message.data.tab)
      //useTabsetService().saveTabset(tabset)
    }
  } else if (message.name === 'tab-added') {
    // hmm - getting this twice...
    console.log(" > got message '" + message.name + "'", message)
    useTabsetService().reloadTabset(message.data.tabsetId)
    //updateSelectedTabset(message.data.tabsetId, true)
  } else if (message.name === 'tab-deleted') {
    useTabsetService().reloadTabset(message.data.tabsetId)
  } else if (message.name === 'tabset-added') {
    useTabsetService().reloadTabset(message.data.tabsetId)
    // } else if (message.name === "mark-tabset-deleted") {
    //   TabsetService.markAsDeleted(message.data.tabsetId)
  } else if (message.name === 'tabset-renamed') {
    useTabsetService().rename(message.data.tabsetId, message.data.newName, message.data.newColor)
  } else if (message.name === 'progress-indicator') {
    if (message.percent) {
      uiStore.setProgress(message.percent)
      // uiStore.progressLabel = message.label
    }
    if (message.status === 'done') {
      uiStore.stopProgress()
    }
    sendResponse('ui store progress set to ' + JSON.stringify(uiStore.progress))
  } else if (message.name === 'detail-level-changed') {
    console.log('setting list detail level to ', message.data.level)
    useUiStore().setListDetailLevel(message.data.level)
  } else if (message.name === 'detail-level-perTabset-changed') {
    console.log('setting list detail perTabset level to ', message.data.level)
    useUiStore().showDetailsPerTabset = message.data.level
  } else if (message.name === 'settings-changed') {
    console.log(`setting ${message.data.identifier} to ${message.data.value}`)
    switch (message.data.identifier) {
      case 'ui.fullUrls':
        useUiStore().setShowFullUrls(message.data.value)
        break
      case 'ui.overlapIndicator':
        useUiStore().setOverlapIndicator(message.data.value)
        break
      case 'ui.contentScriptLoggingOff':
        useUiStore().setContentScriptLoggingOff(message.data.value)
        break
      case 'ui.fontsize':
        useUiStore().setFontsize(message.data.value)
        break
      case 'ui.folder.style':
        useUiStore().setFolderStyle(message.data.value)
        break
      default:
        console.log(`unknown message identifier ${message.data.identifier}`)
    }
  } else if (message.name === 'reload-suggestions') {
    console.log('reload-suggestions message received')
    useSuggestionsStore().loadSuggestionsFromDb()
  } else if (message.name === 'reload-tabset') {
    console.log('reload-tabset message received')
    const tabsetId = message.data.tabsetId ? message.data.tabsetId : useTabsetsStore().getCurrentTabset?.id
    useTabsetService().reloadTabset(tabsetId)
  } else if (message.name === 'tabsets.app.change.currentTabset') {
    if (currentTabset.value) {
      useTabsetService()
        .reloadTabset(currentTabset.value.id)
        .then((ts: Tabset) => {
          currentTabset.value = ts
          //console.log('reloading tabset: ', ts)
        })
    }
  } else if (message.name === 'reload-application') {
    //AppService.restart('restarted=true')
    console.error('message reload-applictation was called, no-op')
  } else if (message.name === 'window-updated') {
    useWindowsStore().setup('window-updated event')
  } else if (message.name === 'refresh-store') {
    console.log('refresh-store message received')
    const tabsetId = useTabsetsStore().getCurrentTabset!.id
    useTabsetService().reloadTabset(tabsetId, 'SidePanelPage2')
  } else {
    console.log('got unmatched message', message)
  }
  return true
}

if (inBexMode()) {
  // seems we need to define these listeners here to get the matching messages reliably
  // these messages are created by triggering events in the mainpanel
  // console.warn('adding on message listener!', chrome.runtime.onMessage.hasListeners())
  chrome.runtime.onMessage.addListener(onMessageListener)
}

onUnmounted(() => {
  if (inBexMode()) {
    console.log('removing on message listener!')
    chrome.runtime.onMessage.removeListener(onMessageListener)
  }
})

const showStartingHint = () => !useUiStore().appLoading && useTabsetsStore().allTabsCount === 0

const termChanged = (a: { term: string }) => (filter.value = a.term)

const tabsetChanged = () => {
  currentTabset.value = useTabsetsStore().getCurrentTabset
}
</script>

<style lang="scss" src="./css/sidePanelPage2.scss" />
