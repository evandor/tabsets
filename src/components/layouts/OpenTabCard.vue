<template>

  <q-card class="tabBorder" flat
          :style="cardStyle(tab)">

    <q-card-section class="q-pt-xs cursor-pointer" style="width:100%;">

      <div class="row items-baseline">
        <div class="col-2">
          <TabFaviconWidget :tab="tab" width="20px" height="20px"/>
        </div>
        <div class="col-2">
          <TabFaviconWidget :tab="tab" width="20px" height="20px"/>
        </div>
        <div class="col-7 text-body2 ellipsis cursor-pointer"
             @mouseenter="emitInfo(tab.chromeTab?.url)"
             @mouseout="emitInfo(undefined)"
             @click="NavigationService.openOrCreateTab(tab.chromeTab?.url)">
          <span v-if="tab.chromeTab?.discarded">*</span>&nbsp;{{ tab.chromeTab?.title }}
        </div>
        <div class="col-1">
          <q-icon name="close" @click="closeTab(tab)" v-if="!isSelf(tab.chromeTab.url)">
            <q-tooltip class="tooltip">Close this tab in the browser</q-tooltip>
          </q-icon>
        </div>
      </div>

    </q-card-section>


  </q-card>
</template>

<script setup lang="ts">

import {Tab} from "src/models/Tab"
import NavigationService from "src/services/NavigationService"
import {useFeatureTogglesStore} from "stores/featureTogglesStore"
import TabFaviconWidget from "src/components/widgets/TabFaviconWidget.vue"
import {useTabsetService} from "src/services/TabsetService2";
import {useUiStore} from "stores/uiStore";

const featureToggles = useFeatureTogglesStore()

const props = defineProps({
  tab: {
    type: Object,
    required: true
  }
})

const closeTab = (tab: Tab) => NavigationService.closeChromeTab(tab)

const cardStyle = (tab: Tab) => {
  const height = "30px";
  let background = ''
  if (tab.isDuplicate) {
    background = "background: radial-gradient(circle, #FFFFFF 0%, #FFECB3 100%)"
  }
  if (useTabsetService().urlExistsInCurrentTabset(tab.chromeTab?.url || '')) {
    background = "background: #efefef"
  }
  return `height: ${height};max-height:${height}; min-height: ${height};position:relative; top:5px;${background}`
}

const self = chrome.runtime.getURL("")

const isSelf = (url: string) => url.startsWith(self)

const emitInfo = (msg: string | undefined) => useUiStore().footerInfo = msg

</script>

<style lang="sass" scoped>

.tabBorder
  border-radius: 5px 5px 0 0
  border: 1px solid $lightgrey
  border-bottom: 0px

</style>
