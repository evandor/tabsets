<template>
  <div
    class="row q-ma-none q-mt-xs q-pt-sm "
    :class="alreadyInTabset() ? 'bg-grey-1':'bg-yellow-1'"
    style="border:1px solid lightgray;border-radius: 5px">

    <div class="col-12">
      <CurrentTabElementHelper/>
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
import CurrentTabElementHelper from "pages/sidepanel/helper/CurrentTabElementHelper.vue";

const router = useRouter()
const tabsStore = useTabsStore()

const currentChromeTab = ref<chrome.tabs.Tab>(null as unknown as chrome.tabs.Tab)
const selectedTab = ref<Tab | undefined>(undefined)
const tabsetCandidates = ref<object[]>([])

const tabFromChromeTab = () => currentChromeTab.value ? new Tab(uid(), currentChromeTab.value) : undefined

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
    try {
      const c = await TabsetService.getContentForUrl(currentChromeTab.value.url)
      tabsetCandidates.value = c ? (c['tabsetCandidates' as keyof object] || []) : []
    } catch (err) {
      console.log("got error: ", err)
    }
  }
})


const alreadyInTabset = () => {
  if (currentChromeTab.value?.url && tabsStore.getCurrentTabset) {
    return useTabsetService().urlExistsInCurrentTabset(currentChromeTab.value.url)
  }
  return false
}
</script>
