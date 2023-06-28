<template>

  <q-page style="padding-top: 50px">

    <!-- list of tabs, assuming here we have at least one tabset -->
    <div class="q-ma-none">

      <div class="q-ma-none q-pa-none">
        <q-list dense class="rounded-borders q-ma-none q-pa-none" v-for="tabset in [...tabsStore.tabsets.values()]">
          <q-expansion-item
            expand-separator
            :label="tabset.name"
            :caption="tabsetCaption(tabset)">

            <SidePanelTabInfo/>

            <PanelTabList :tabs="filteredTabs(tabset.id)"/>

          </q-expansion-item>


        </q-list>
      </div>


      <div class="q-ma-none">

        <div class="text-caption q-ma-md"
             v-if="!route.query.first && tabsStore.getCurrentTabset?.tabs.length === 0 && tabsStore.getCurrentTabset?.type === TabsetType.DEFAULT">
          Start browsing and add the tabs you like to this tabset
        </div>

        <!-- <div class="row q-ma-none q-pa-none" v-if="tabsStore.getCurrentTabset">
           <div class="col-12 q-ma-none q-pa-none q-pt-lg">

             <SidePanelDynamicTabset v-if="tabsStore.getCurrentTabset?.type === TabsetType.DYNAMIC"
                                     :tabset="tabsStore.getCurrentTabset"/>
             <PanelTabList v-else :tabs="filteredTabs()"/>

           </div>
         </div>-->

      </div>

    </div>

    <!-- place QPageSticky at end of page -->
    <q-page-sticky expand position="top" style="background-color:white">

      <FirstToolbarHelper/>
      <!--<SecondToolbarHelper/>-->

      <!-- selected tab or current tab from chrome
      <div class="q-my-none q-mx-none q-pa-none fit bg-white"
           style="max-height:135px;min-height:135px;">
        <SidePanelTabInfo/>
      </div>-->

    </q-page-sticky>

  </q-page>

</template>

<script lang="ts" setup>

import {ref, watchEffect} from "vue";
import {useTabsStore} from "src/stores/tabsStore";
import {Tab} from "src/models/Tab";
import _ from "lodash"
import {Tabset, TabsetType} from "src/models/Tabset";
import {useRoute, useRouter} from "vue-router";
import {useUtils} from "src/services/Utils";
import {useQuasar} from "quasar";
import {useTabsetService} from "src/services/TabsetService2";
import NewTabsetDialog from "components/dialogues/NewTabsetDialog.vue";
import {useUiStore} from "src/stores/uiStore";
import PanelTabList from "components/layouts/PanelTabList.vue";
import {usePermissionsStore} from "src/stores/permissionsStore";
import {useSpacesStore} from "src/stores/spacesStore";
import SidePanelDynamicTabset from "components/layouts/sidepanel/SidePanelDynamicTabset.vue";
import {useLogsStore} from "stores/logsStore";
import SidePanelTabInfo from "pages/sidepanel/SidePanelTabInfo.vue";
import FirstToolbarHelper from "pages/sidepanel/helper/FirstToolbarHelper.vue";
import SecondToolbarHelper from "pages/sidepanel/helper/SecondToolbarHelper.vue";

const {inBexMode, sanitize, sendMsg} = useUtils()

const $q = useQuasar()
const router = useRouter()
const route = useRoute()

const tabsStore = useTabsStore()
const spacesStore = useSpacesStore()
const uiStore = useUiStore()
const show = ref(false)

const currentChromeTabs = ref<chrome.tabs.Tab[]>([])
const tabsetName = ref<object>(null as unknown as object)
const tabsetNameOptions = ref<object[]>([])
const openTabs = ref<chrome.tabs.Tab[]>([])
const currentTabset = ref<Tabset | undefined>(undefined)
const currentChromeTab = ref<chrome.tabs.Tab>(null as unknown as chrome.tabs.Tab)
const orderDesc = ref(false)

const logs = ref<object[]>([])
const progress = ref<number | undefined>(undefined)
const progressLabel = ref<string | undefined>(undefined)

const selectedTab = ref<Tab | undefined>(undefined)

watchEffect(() => {
  selectedTab.value = useUiStore().getSelectedTab
  if (selectedTab.value) {
    currentChromeTab.value = null as unknown as chrome.tabs.Tab
  }
})

watchEffect(() => {
  progress.value = (uiStore.progress || 0.0) / 100.0
  progressLabel.value = uiStore.progressLabel + " " + Math.round(100 * progress.value) + "%"
})

watchEffect(() => {
  logs.value = useLogsStore().logs
})

function inIgnoredMessages(message: any) {
  return message.msg === "html2text" ||
    message.msg === "html2links" ||
    message.name === "zero-shot-classification" ||
    message.msg === "init-ai-module";
}

if (inBexMode()) {
  // seems we need to define these listeners here to get the matching messages reliably
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (inIgnoredMessages(message)) {
      return true
    }
    if (message.name === 'current-tabset-id-change') {
      const tsId = message.data.tabsetId
      useTabsStore().selectCurrentTabset(tsId)
    } else if (message.name === 'feature-activated' || message.name === "feature-deactivated") {
      usePermissionsStore().initialize()
    } else if (message.name === "tabsets-imported") {
      useSpacesStore().reload()
      useTabsetService().init()
      // TODO reload
    } else if (message.name === "tab-being-dragged") {
      useUiStore().draggingTab(message.data.tabId, null as unknown as any)
    } else if (message.name === "tab-changed") {
      const tabset = useTabsetService().getTabset(message.data.tabsetId) as Tabset
      // replace tab (seems necessary !?) TODO
      tabset.tabs = _.map(tabset.tabs, (t: Tab) => (t.id === message.data.tab.id) ? message.data.tab : t)
      useTabsetService().saveTabset(tabset)
        .then((res) => {
          console.log("saved tabset", tabset)
        })
        .catch((err) => {
          console.error("got error " + err)
        })
    } else if (message.name === "progress-indicator") {
      //console.log(" > got message '" + message.name + "'", message)
      if (message.percent) {
        uiStore.progress = message.percent
        uiStore.progressLabel = message.label
      }
      if (message.status === "done") {
        uiStore.progress = undefined
        uiStore.progressLabel = undefined
      }
      sendResponse("ui store progress set to " + uiStore.progress)
    } else {
      console.log("got unmatched message", message)
    }
    return true
  })
} else {
  useRouter().push("/start")
}

watchEffect(() => {
  openTabs.value = useTabsStore().tabs
  currentTabset.value = useTabsStore().getCurrentTabset
})

watchEffect(() => {
  currentChromeTab.value = useTabsStore().currentChromeTab
})

watchEffect(() => {
  if (useTabsStore().tabsets) {
    tabsetNameOptions.value = _.map([...useTabsStore().tabsets.values()], (ts: Tabset) => {
      return {
        label: ts.name,
        value: ts.id
      }
    })
    if (tabsetNameOptions.value.length > 0) {
      tabsetName.value = tabsetNameOptions.value[0]
    }
  }
})

if (inBexMode()) {
  let queryOptions = {active: true, lastFocusedWindow: true};
  chrome.tabs.query(queryOptions, (tab) => {
    currentChromeTabs.value = tab
  })
}

const navigate = (target: string) => router.push(target)

const tabsets = (): Tabset[] => {
  let tabsets = [...tabsStore.tabsets.values()]
  return tabsets
}

function filteredTabs(tabsetId: string): Tab[] {
  const filter = useUiStore().tabsFilter
  const tabs = useTabsetService().getTabset(tabsetId)?.tabs || []
  if (filter && filter.trim() !== '') {
    return _.orderBy(_.filter(tabs, (t: Tab) => {
        return (t.chromeTab.url || '')?.indexOf(filter) >= 0 ||
          (t.chromeTab.title || '')?.indexOf(filter) >= 0 ||
          t.description?.indexOf(filter) >= 0
      })
      , getOrder(), [orderDesc.value ? 'desc' : 'asc'])
  }
  return _.orderBy(tabs, getOrder(), [orderDesc.value ? 'desc' : 'asc'])
}

function getOrder() {
  if (tabsStore.getCurrentTabset) {
    switch (tabsStore.getCurrentTabset.sorting) {
      case 'alphabeticalUrl':
        return (t: Tab) => t.chromeTab.url?.replace("https://", "").replace("http://", "").toUpperCase()
      case 'alphabeticalTitle':
        return (t: Tab) => t.chromeTab.title?.toUpperCase()
      default:
        return (t: Tab) => 1
    }
    return (t: Tab) => 1
  }
}

const showTooltip = (nr: number) => {
  return tooltipToShow.value === nr
}

const tabsetCaption = (tabset: Tabset) => tabset.tabs?.length.toString() + ' tab' + (tabset.tabs?.length === 1 ? '' : 's')

</script>

<style scoped>

.v-enter-active,
.v-leave-active {
  transition: opacity 0.5s ease;
}

.v-enter-from,
.v-leave-to {
  opacity: 0;
}
</style>
