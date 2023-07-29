<template>
  <div
    v-if="!alreadyInTabset()"
    class="row q-ma-none q-pt-sm q-ma-sm"
    style="border:1px solid lightgray;border-radius: 5px">

    <div class="col-12" v-if="route && route.query.first && route.query.first === 'true'">
      <div class="row">
        <div class="col text-caption q-pa-md">
          Here you will see the <i>current tab</i> of your browser.
          Click 'START' and add it to your new tabset.<br><br>
          <q-btn label="start" @click="router.push('/sidepanel')"/>
        </div>
      </div>
    </div>
    <div class="col-12" v-else>
      <CurrentTabElementHelper :tabsetId="props.tabsetId" />
    </div>
  </div>

</template>

<script lang="ts" setup>

import {Tab} from "src/models/Tab";
import {uid} from "quasar";
import {useRoute, useRouter} from "vue-router";
import {useTabsStore} from "stores/tabsStore";
import {useTabsetService} from "src/services/TabsetService2";
import {ref, watchEffect} from "vue";
import {useUiStore} from "stores/uiStore";
import TabsetService from "src/services/TabsetService";
import CurrentTabElementHelper from "pages/sidepanel/helper/CurrentTabElementHelper.vue";

const props = defineProps({
  tabsetId: {type: String, required: true}
})

const router = useRouter()
const route = useRoute()
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
