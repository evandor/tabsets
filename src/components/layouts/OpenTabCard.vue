<template>

  <q-card class="tabBorder" flat
          :style="cardStyle(tab)">

    <q-card-section class="q-pt-xs cursor-pointer" style="width:100%;" >

      <div class="row items-baseline">
        <div class="col-2">
          <TabFaviconWidget :tab="tab" width="20px" height="20px" />
        </div>
        <div class="col-9 text-body2 ellipsis cursor-pointer" @click="NavigationService.openOrCreateTab(tab.chromeTab?.url)">
          <span v-if="tab.chromeTab?.discarded">*</span>&nbsp;{{ tab.chromeTab?.title }}
          <q-tooltip v-if="featureToggles.isEnabled('debug')">{{tab.chromeTab}}</q-tooltip>
        </div>
        <div class="col-1">
          <q-icon name="close" @click="closeTab(tab)"/>
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

const featureToggles = useFeatureTogglesStore()

const props = defineProps({
  tab: {
    type: Object,
    required: true
  }
})

const closeTab = (tab: Tab) => NavigationService.closeChromeTab(tab)

const  cardStyle = (tab: Tab) => {
  const height = "30px";
  let background = ''
  if (tab.isDuplicate) {
    background = "background: radial-gradient(circle, #FFFFFF 0%, #FFECB3 100%)"
  }
  return `height: ${height};max-height:${height}; min-height: ${height};position:relative; top:5px;${background}`
}

</script>

<style lang="sass" scoped>

.tabBorder
  border-radius: 5px 5px 0 0
  border: 1px solid $lightgrey
  border-bottom: 0px

</style>
