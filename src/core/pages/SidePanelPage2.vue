<template>
  <!-- SidePanelPage2 -->
  <q-page
    class="darkInDarkMode brightInBrightMode"
    :class="uiDensity === 'dense' ? 'q-px-none' : 'q-px-md'"
    :style="paddingTop"
    style="border: 0 solid black">
    <offline-info />

    <div class="wrap" v-if="useUiStore().appLoading">
      <div class="loading">
        <div class="bounceball q-mr-lg"></div>
        <div class="text">{{ useUiStore().appLoading }}</div>
      </div>
    </div>

    <!-- list of tabs, assuming here we have at least one tabset -->
    <div class="q-ma-none q-pa-none q-pt-xs">
      <div class="row q-ma-none q-pa-none items-start darkInDarkMode brightInBrightMode">
        <q-list bordered class="rounded-borders fit">
          <q-expansion-item
            v-for="sts in specialTabsets"
            @click="openRecipeOverview(sts)"
            :icon="sts.icon"
            :label="sts.name"
            :caption="sts.tabs.length + ' tab(s)'">
            <SidePanelPageContent
              :tabset="sts"
              :key="sts?.id"
              :filter="filter"
              @tabs-found="(n: number) => (filteredTabsCount = n)"
              @folders-found="(n: number) => (filteredFoldersCount = n)" />
          </q-expansion-item>
        </q-list>

        <!--        <div class="col-12 text-center" v-for="sts in specialTabsets">-->
        <!--          <q-btn :label="sts.name" color="primary" size="xs" @click="openRecipeOverview()" />-->
        <!--        </div>-->
        <template v-if="currentTabset">
          <SidePanelPageContent
            v-if="useFolderExpansion === 'goInto'"
            :tabset="currentTabset"
            :key="currentTabset?.id"
            :filter="filter"
            @tabs-found="(n: number) => (filteredTabsCount = n)"
            @folders-found="(n: number) => (filteredFoldersCount = n)" />
          <SidePanelPageContentExpand
            v-else
            :tabset="currentTabset"
            :key="currentTabset.id"
            :filter="filter"
            @tabs-found="(n: number) => (filteredTabsCount = n)"
            @folders-found="(n: number) => (filteredFoldersCount = n)" />
        </template>
        <template v-if="useSettingsStore().has('DEBUG_MODE')">
          <DebugInfo />
        </template>
      </div>

      <StartingHint v-if="showStartingHint()" />
    </div>

    <q-page-sticky
      expand
      position="top"
      class="darkInDarkMode brightInBrightMode"
      :class="uiDensity === 'dense' ? 'q-mx-none' : 'q-ma-md'">
      <FirstToolbarHelper2 :element="'contextmenu'" @tabset-changed="tabsetChanged()" />
      <SearchToolbarHelper
        v-if="showSearchToolbarHelper"
        @on-term-changed="(val) => termChanged(val)"
        :filteredFoldersCount="filteredFoldersCount"
        :filteredTabsCount="filteredTabsCount" />
    </q-page-sticky>
  </q-page>
</template>

<script lang="ts" setup>
import _ from 'lodash'
import { LocalStorage } from 'quasar'
import { FeatureIdent } from 'src/app/models/FeatureIdent'
import OfflineInfo from 'src/core/components/helper/offlineInfo.vue'
import FirstToolbarHelper2 from 'src/core/pages/sidepanel/helper/FirstToolbarHelper2.vue'
import SearchToolbarHelper from 'src/core/pages/sidepanel/helper/SearchToolbarHelper.vue'
import SidePanelPageContent from 'src/core/pages/SidePanelPageContent.vue'
import SidePanelPageContentExpand from 'src/core/pages/SidePanelPageContentExpand.vue'
import DebugInfo from 'src/core/pages/widgets/DebugInfo.vue'
import StartingHint from 'src/core/pages/widgets/StartingHint.vue'
import { useUtils } from 'src/core/services/Utils'
import { useSettingsStore } from 'src/core/stores/settingsStore'
import Analytics from 'src/core/utils/google-analytics'
import { useFeaturesStore } from 'src/features/stores/featuresStore'
import NavigationService from 'src/services/NavigationService'
import { useSpacesStore } from 'src/spaces/stores/spacesStore'
import { useSuggestionsStore } from 'src/suggestions/stores/suggestionsStore'
import { Tabset, TabsetStatus, TabsetType } from 'src/tabsets/models/Tabset'
import { useTabsetService } from 'src/tabsets/services/TabsetService2'
import { useTabsetsStore } from 'src/tabsets/stores/tabsetsStore'
import { useTabsStore2 } from 'src/tabsets/stores/tabsStore2'
import { FolderAppearance, UiDensity, useUiStore } from 'src/ui/stores/uiStore'
import { useWindowsStore } from 'src/windows/stores/windowsStore'
import { onMounted, onUnmounted, provide, ref, watch, watchEffect } from 'vue'
import { useRouter } from 'vue-router'

const { inBexMode } = useUtils()

const router = useRouter()

const filter = ref<string>('')
const tabsets = ref<Tabset[]>([])
const currentTabset = ref<Tabset | undefined>(undefined)
const currentChromeTab = ref<chrome.tabs.Tab | undefined>(undefined)
const tabsetsLastUpdate = ref(0)
const filteredTabsCount = ref(0)
const filteredFoldersCount = ref(0)
const useFolderExpansion = ref<FolderAppearance>(useUiStore().folderStyle)
const showSearchToolbarHelper = ref<boolean>(useUiStore().quickAccessFor('search'))
const paddingTop = ref('padding-top: 80px')
const uiDensity = ref<UiDensity>(useUiStore().uiDensity)
const specialTabsets = ref<Tabset[]>([])

provide('ui.density', uiDensity)

function updateOnlineStatus(e: any) {
  const { type } = e
  useUiStore().networkOnline = type === 'online'
}

onMounted(() => {
  window.addEventListener('offline', (e) => updateOnlineStatus(e))
  window.addEventListener('online', (e) => updateOnlineStatus(e))

  Analytics.firePageViewEvent('SidePanelPage2', document.location.href)

  const hideWelcomePage: boolean | null = LocalStorage.getItem('ui.hideWelcomePage')
  if (!hideWelcomePage) {
    router.push('/sidepanel/welcome')
  }
})

watchEffect(() => {
  specialTabsets.value = [...useTabsetsStore().tabsets.values()].filter((ts: Tabset) => ts.type === TabsetType.SPECIAL)
})

watch(
  () => useUiStore().quickAccessLastChange,
  (a: any, b: any) => {
    setTimeout(() => {
      showSearchToolbarHelper.value = useUiStore().quickAccessFor('search')
      setPaddingTop()
    }, 500)
  },
)

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
  } else {
    tabsets.value = determineTabsets()
  }
})

watchEffect(() => {
  const windowId = useWindowsStore().currentBrowserWindow?.id || 0
  currentChromeTab.value = useTabsStore2().getCurrentChromeTab(windowId) || useTabsStore2().currentChromeTab
})

function inIgnoredMessages(message: any) {
  return (
    message.msg === 'captureClipping' ||
    message.msg === 'captureThumbnail' ||
    message.name === 'reload-spaces' ||
    message.name === 'init-ai-module' ||
    message.name === 'zero-shot-classification'
  )
}

const onMessageListener = (message: any) => {
  if (inIgnoredMessages(message)) {
    return true
  }
  console.log(' <<< message', message)
  if (message.name === 'feature-activated') {
    useFeaturesStore().activateFeature(message.data.feature)
  } else if (message.name === 'feature-deactivated') {
    useFeaturesStore().deactivateFeature(message.data.feature)
  } else if (message.name === 'setting-activated') {
    useSettingsStore().setToggle(message.data.setting, true)
  } else if (message.name === 'setting-deactivated') {
    useSettingsStore().setToggle(message.data.setting, false)
  } else if (message.name === 'show-ignored') {
    useTabsetsStore().selectCurrentTabset('IGNORED')
    router.push('/sidepanel')
  } else if (message.name === 'text-selection') {
    console.log('message', message)
  } else if (message.name === 'tabsets-imported') {
    useSpacesStore().loadSpaces()
    useTabsetService().init()
    // router.push('/sidepanel/collections')
    window.location.reload()
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
  } else if (message.name === 'tab-deleted') {
    useTabsetService().reloadTabset(message.data.tabsetId)
  } else if (message.name === 'tabset-added') {
    useTabsetService().reloadTabset(message.data.tabsetId)
  } else if (message.name === 'tabset-renamed') {
    useTabsetService().rename(message.data.tabsetId, message.data.newName, message.data.newColor)
  } else if (message.name === 'detail-level-changed') {
    console.log('setting list detail level to ', message.data.level)
    useUiStore().setListDetailLevel(message.data.level)
    // } else if (message.name === 'detail-level-perTabset-changed') {
    //   console.log('setting list detail perTabset level to ', message.data.level)
    //   useUiStore().showDetailsPerTabset = message.data.level
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
      case 'ui.density':
        //useUiStore().setUiDensity(message.data.value)
        uiDensity.value = message.data.value
        setPaddingTop()
        break
      case 'ui.folder.style':
        useUiStore().setFolderStyle(message.data.value)
        // make sure to start from root level
        const currentTs = useTabsetsStore().getCurrentTabset
        if (currentTs) {
          currentTs.folderActive = undefined
          useTabsetsStore().saveTabset(currentTs)
        }
        break
      case 'ui.quickAccess':
        console.log('message', message)
        showSearchToolbarHelper.value = message.data.value
        setPaddingTop()
        // console.log('showSearchToolbarHelper', showSearchToolbarHelper.value)
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
    // console.error('message reload-application was called, no-op')
    window.location.reload()
  } else if (message.name === 'window-updated') {
    useWindowsStore().setup('window-updated event')
  } else if (message.name === 'refresh-store') {
    console.log('refresh-store message received')
    const tabsetId = useTabsetsStore().getCurrentTabset!.id
    useTabsetService().reloadTabset(tabsetId, 'SidePanelPage2')
  } else if (message.name === 'progress-indicator') {
    if (message.percent) {
      useUiStore().setProgress(message.percent, message.label)
    }
    if (message.status === 'done') {
      useUiStore().stopProgress()
    }
    //sendResponse("ui store progress set to " + uiStore.progress)
  } else {
    console.log('got unmatched message', message)
  }
  return true
}

if (inBexMode()) {
  // seems we need to define these listeners here to get the matching messages reliably
  // these messages are created by triggering events in the mainpanel
  // console.warn('adding onMessage listener!')
  chrome.runtime.onMessage.addListener(onMessageListener)
}

onUnmounted(() => {
  if (inBexMode()) {
    console.log('removing onMessage listener!')
    chrome.runtime.onMessage.removeListener(onMessageListener)
  }
})

const showStartingHint = () =>
  !useUiStore().appLoading &&
  currentTabset.value?.name === 'My first Tabset' &&
  !LocalStorage.getItem('ui.hideStartingHint')

const termChanged = (a: { term: string }) => (filter.value = a.term)

const tabsetChanged = () => {
  currentTabset.value = useTabsetsStore().getCurrentTabset
}

const setPaddingTop = () => {
  if (showSearchToolbarHelper.value) {
    if (uiDensity.value === 'dense') {
      paddingTop.value = 'padding-top: 80px'
    } else {
      paddingTop.value = 'padding-top: 98px'
    }
  } else {
    if (uiDensity.value !== 'dense') {
      paddingTop.value = 'padding-top: 80px'
    } else {
      paddingTop.value = 'padding-top: 48px'
    }
  }
  //paddingTop.value = showSearchToolbarHelper.value ? 'padding-top: 80px' : 'padding-top: 48px'
}

const openRecipeOverview = (ts: Tabset) => {
  NavigationService.openOrCreateTab([chrome.runtime.getURL(`www/index.html#/mainpanel/rezepte/${ts.id}`)])
}

setPaddingTop()
</script>

<style lang="scss" src="src/pages/css/sidePanelPage2.scss" />
