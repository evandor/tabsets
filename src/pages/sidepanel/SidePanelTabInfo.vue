<template>
  <div
      v-if="!alreadyInTabset() && useUiStore().showCurrentTabBox"
      class="row q-ma-none q-pt-sm q-ma-sm"
      style="border:1px solid lightgray;border-radius: 5px">

<!--    <div class="col-12" v-if="route && route.query.first && route.query.first === 'true'">-->
<!--      <div class="row">-->
<!--        <div class="col text-caption q-pa-md">-->
<!--          Here you will see the <i>current tab</i> of your browser.-->
<!--          Click 'START' and add it to your new tabset.<br><br>-->
<!--          <q-btn label="start" data-testid='startAddingTabsBtn' @click="router.push('/sidepanel')"/>-->
<!--        </div>-->
<!--      </div>-->
<!--    </div>-->
    <div class="col-12">
      <CurrentTabElementHelper :tabsetId="props.tabsetId"/>
    </div>
  </div>

  <div v-if="!useUiStore().showCurrentTabBox">
    <div class="row">
      <div class="col text-right text-caption text-grey-6">
        show current tab <q-icon name="expand_more"
                @click="showCurrentTabBox()"
                color="accent" class="cursor-pointer" size="xs">
          <q-tooltip>Show current tab again</q-tooltip>
        </q-icon>
      </div>
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
import {useWindowsStore} from "stores/windowsStores";
import {useCommandExecutor} from "src/services/CommandExecutor";
import {HideCurrentTabBoxCommand} from "src/domain/commands/ui/HideCurrentTabBoxCommand";

const props = defineProps({
  tabsetId: {type: String, required: true}
})

const router = useRouter()
const route = useRoute()
const tabsStore = useTabsStore()

const currentChromeTab = ref<chrome.tabs.Tab>(null as unknown as chrome.tabs.Tab)
const selectedTab = ref<Tab | undefined>(undefined)

watchEffect(() => {
  selectedTab.value = useUiStore().getSelectedTab
  if (selectedTab.value) {
    currentChromeTab.value = null as unknown as chrome.tabs.Tab
  }
})

watchEffect(() => {
  const windowId = useWindowsStore().currentWindow?.id || 0
  currentChromeTab.value = useTabsStore().getCurrentChromeTab(windowId) || useTabsStore().currentChromeTab
})

const alreadyInTabset = () => {
  if (currentChromeTab.value?.url && tabsStore.getCurrentTabset) {
    return useTabsetService().urlExistsInCurrentTabset(currentChromeTab.value.url)
  }
  return false
}

const showCurrentTabBox = () => useCommandExecutor().execute(new HideCurrentTabBoxCommand(false))
</script>
