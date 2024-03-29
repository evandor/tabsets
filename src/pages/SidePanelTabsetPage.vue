<template>

  <q-page style="padding-top: 50px">
    <div class="q-ma-none q-pa-none">

      <SidePanelPageTabList
        v-if="tabset"
        :sorting="sorting"
        :show-tabsets="true"
        :preventDragAndDrop="preventDragAndDrop(sorting)"
        :tabset="tabset as Tabset"/>

    </div>

    <!-- place QPageSticky at end of page -->
    <q-page-sticky expand position="top" class="darkInDarkMode brightInBrightMode">

      <FirstToolbarHelper>

        <template v-slot:title>
          <div class="text-subtitle1">
            <SidePanelTabsetsSelectorWidget/>
          </div>
        </template>

        <template v-slot:iconsRight>

          <q-btn v-if="sorting !== TabSorting.CUSTOM"
                 :icon="descending ? 'arrow_upward' : 'arrow_downward'"
                 @click="toggleOrder()"
                 color="accent"
                 flat
                 class="q-mx-xs q-pa-xs cursor-pointer"
                 style="max-width:20px"
                 size="10px">
            <q-tooltip class="tooltip" v-if="descending">Descending</q-tooltip>
            <q-tooltip class="tooltip" v-else>Ascending</q-tooltip>
          </q-btn>

          <q-btn
            icon="sort"
            @click="toggleSorting()"
            color="accent"
            flat
            class="q-mx-xs q-pa-xs cursor-pointer"
            style="max-width:20px"
            size="10px">
            <q-tooltip class="tooltip">Toggle Sorting - now: {{ sorting }}</q-tooltip>
          </q-btn>

          <!--          <span class="q-ma-none q-pa-none q-mx-sm text-grey-5">|</span>-->

          <q-btn
            v-if="usePermissionsStore().hasFeature(FeatureIdent.NOTES)"
            @click.stop="startTabsetNote()"
            class="q-mx-xs q-pa-xs cursor-pointer"
            icon="o_add_circle"
            style="max-width:20px"
            size="10px">
            <q-tooltip class="tooltip-small">
              Add Note to '{{ tabset?.name }}'
            </q-tooltip>
          </q-btn>

          <q-btn
            @click.stop="saveInTabset()"
            class="q-mx-xs q-pa-xs cursor-pointer"
            icon="o_bookmark_add"
            :class="alreadyInTabset() ? '':'cursor-pointer'"
            :color="alreadyInTabset() ? 'grey-5': 'warning'"
            style="max-width:20px"
            size="10px">
            <q-tooltip class="tooltip-small">
              Add current Tab to '{{ tabset?.name }}'
            </q-tooltip>
          </q-btn>

        </template>

      </FirstToolbarHelper>

    </q-page-sticky>
  </q-page>

</template>

<script lang="ts" setup>

import {onMounted, ref, watchEffect} from "vue";
import {useTabsStore} from "src/stores/tabsStore";
import {Tab, TabSorting} from "src/models/Tab";
import {Tabset} from "src/models/Tabset";
import {useRoute} from "vue-router";
import {useUtils} from "src/services/Utils";
import {useUiStore} from "src/stores/uiStore";
import FirstToolbarHelper from "pages/sidepanel/helper/FirstToolbarHelper.vue";
import {useWindowsStore} from "src/stores/windowsStore";
import Analytics from "src/utils/google-analytics";
import SidePanelTabsetsSelectorWidget from "components/widgets/SidePanelTabsetsSelectorWidget.vue";
import {uid, useQuasar} from "quasar";
import SidePanelPageTabList from "components/layouts/SidePanelPageTabList.vue";
import {useTabsetService} from "src/services/TabsetService2";
import {useCommandExecutor} from "src/services/CommandExecutor";
import {AddTabToTabsetCommand} from "src/domain/tabs/AddTabToTabsetCommand"
import {usePermissionsStore} from "stores/permissionsStore";
import {FeatureIdent} from "src/models/AppFeature";
import ContextMenuItem from "pages/sidepanel/helper/ContextMenuItem.vue";
import NavigationService from "src/services/NavigationService";

const {inBexMode} = useUtils()

const $q = useQuasar()
const route = useRoute()

const tabsetId = ref<string | undefined>(undefined)
const tabset = ref<Tabset | undefined>(undefined)

const currentChromeTabs = ref<chrome.tabs.Tab[]>([])
const openTabs = ref<chrome.tabs.Tab[]>([])
const currentTabset = ref<Tabset | undefined>(undefined)
const currentChromeTab = ref<chrome.tabs.Tab>(null as unknown as chrome.tabs.Tab)

const sorting = ref<TabSorting>(TabSorting.CUSTOM)
const descending = ref<boolean>(false)

onMounted(() => {
  Analytics.firePageViewEvent('SidePanelTabsetPage', document.location.href);
})

watchEffect(() => {
  tabsetId.value = route.params.tabsetId as string
  tabset.value = useTabsStore().getTabset(tabsetId.value)
  if (tabset.value) {
    useTabsStore().selectCurrentTabset(tabset.value.id)
  }
})

const tabsets = ref<Tabset[]>([])
const selectedTab = ref<Tab | undefined>(undefined)

watchEffect(() => {
  selectedTab.value = useUiStore().getSelectedTab
  if (selectedTab.value) {
    currentChromeTab.value = null as unknown as chrome.tabs.Tab
  }
})

watchEffect(() => {
  openTabs.value = useTabsStore().tabs
  currentTabset.value = useTabsStore().getCurrentTabset
})

watchEffect(() => {
  const windowId = useWindowsStore().currentChromeWindow?.id || 0
  currentChromeTab.value = useTabsStore().getCurrentChromeTab(windowId) || useTabsStore().currentChromeTab
})

if (inBexMode() && chrome) {
  let queryOptions = {active: true, lastFocusedWindow: true};
  chrome.tabs.query(queryOptions, (tab) => {
    currentChromeTabs.value = tab
  })
}

const toggleSorting = () => {
  switch (sorting.value) {
    case TabSorting.CUSTOM:
      sorting.value = TabSorting.TITLE
      break
    case TabSorting.TITLE:
      sorting.value = TabSorting.URL
      break
    case TabSorting.URL:
      sorting.value = TabSorting.AGE
      break
    case TabSorting.AGE:
      sorting.value = TabSorting.CUSTOM
      break
    default:
      sorting.value = TabSorting.CUSTOM
  }
}

const toggleOrder = () => descending.value = !descending.value

const preventDragAndDrop = (sorting: TabSorting) => $q.platform.is.mobile || sorting !== TabSorting.CUSTOM

const alreadyInTabset = () => {
  if (currentChromeTab.value?.url && useTabsStore().getCurrentTabset) {
    return useTabsetService().urlExistsInCurrentTabset(currentChromeTab.value.url)
  }
  return false
}

const saveInTabset = () => {
  if (alreadyInTabset() || !tabsetId.value) {
    return
  }
  const useTS = useTabsetService().getTabset(tabsetId.value)
  if (useTS) {
    useCommandExecutor().execute(new AddTabToTabsetCommand(new Tab(uid(), currentChromeTab.value), useTS))
  } else {
    console.warn("expected to find tabsetId", tabsetId)
  }
}

const startTabsetNote = () => {
  const url = chrome && chrome.runtime && chrome.runtime.getURL ?
    chrome.runtime.getURL('www/index.html') + "#/mainpanel/notes/?tsId=" + tabsetId + "&edit=true" :
    "#/mainpanel/notes/?tsId=" + tabsetId + "&edit=true"
  NavigationService.openOrCreateTab([url])
}


</script>
