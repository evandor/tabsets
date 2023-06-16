<template>
  <div v-if="tabFromChromeTab() && tabsStore.getCurrentTabset && currentChromeTab.url !== 'chrome://newtab/'"
       class="row q-ma-sm q-mt-lg"
       :class="alreadyInTabset() ? 'bg-grey-1':'bg-yellow-1'"
       style="border:1px solid gray;border-radius: 5px">

    <div class="col-10">
      <q-list>
        <q-item
          v-ripple
          class="q-ma-none q-pa-sm">
          <PanelTabListElementWidget
            header="Current Tab:"
            :tab="tabFromChromeTab()"
            :show-tabsets="true"
            :hideMenu="true"/>
        </q-item>
      </q-list>
    </div>
    <div class="col-2">
      <q-btn :disable="alreadyInTabset()" :label="alreadyInTabset() ? 'saved' :'save'" color="primary" flat
             size="10px" @click="saveFromPanel()"></q-btn>
      <br>
      <q-btn :label="c.candidateName" v-for="c in tabsetCandidates" color="primary" flat size="10px"/>
    </div>
  </div>

  <div v-else-if="selectedTab"
       class="row q-ma-sm q-mt-lg"
       :class="alreadyInTabset() ? 'bg-grey-1':'bg-yellow-1'"
       style="border:1px solid gray;border-radius: 5px">

    <div class="col-12">
      <q-list>
        <q-item
          v-ripple
          class="q-ma-none q-pa-xs">
          <SidePanelTabListElementDetails :tab="selectedTab"/>
        </q-item>
      </q-list>
    </div>
  </div>
</template>

<script lang="ts" setup>

import PanelTabListElementWidget from "components/widgets/PanelTabListElementWidget.vue";
import SidePanelTabListElementDetails from "components/widgets/SidePanelTabListElementDetails.vue";
import {Tab} from "src/models/Tab";
import {uid} from "quasar";
import {useRouter} from "vue-router";
import {useTabsStore} from "stores/tabsStore";
import {useTabsetService} from "src/services/TabsetService2";
import {useCommandExecutor} from "src/services/CommandExecutor";
import {AddTabToTabsetCommand} from "src/domain/tabs/AddTabToTabset";
import {ref, watchEffect} from "vue";
import {useUiStore} from "stores/uiStore";
import TabsetService from "src/services/TabsetService";

const router = useRouter()
const tabsStore = useTabsStore()

const currentChromeTab = ref<chrome.tabs.Tab>(null as unknown as chrome.tabs.Tab)
const selectedTab = ref<Tab | undefined>(undefined)
const tabsetCandidates = ref<object[]>([])

const tabFromChromeTab = () => currentChromeTab.value ? new Tab(uid(), currentChromeTab.value) : undefined

const showTabsets = () => router.push("/sidepanel/spaces")

watchEffect(() => {
  selectedTab.value = useUiStore().getSelectedTab
  if (selectedTab.value) {
    currentChromeTab.value = null as unknown as chrome.tabs.Tab
  }
})

watchEffect(() => {
  currentChromeTab.value = useTabsStore().currentChromeTab
})

watchEffect(async () => {
  if (currentChromeTab.value?.url) {
    const c = await TabsetService.getContentForUrl(currentChromeTab.value.url)
    tabsetCandidates.value = c ? (c['tabsetCandidates' as keyof object] || []) : []
  }
})

const saveFromPanel = () => {
  const currentChromeTab = useTabsStore().currentChromeTab
  console.log("saving from panel...", currentChromeTab)
  if (currentChromeTab && tabsStore.getCurrentTabset) {
    const tabsetId = tabsStore.getCurrentTabset.id // tabsetName.value['value' as keyof object]
    // useTabsetService().addToTabsetId(tabset['value' as keyof object], new Tab(uid(), currentChromeTab))
    const useTS = useTabsetService().getTabset(tabsetId)
    if (useTS) {
      useCommandExecutor().executeFromUi(new AddTabToTabsetCommand(new Tab(uid(), currentChromeTab), useTS))
    }
  }
}

const alreadyInTabset = () => {
  if (currentChromeTab.value?.url && tabsStore.getCurrentTabset) {
    return useTabsetService().urlExistsInCurrentTabset(currentChromeTab.value.url)
  }
  return false
}
</script>
