<template>

<!--  @mouseover="setInfo(tab)"-->
<!--  @mouseout="resetInfo()"-->
<!--  -->
  <q-card class="my-card" flat
          :style="cardStyle(tab)"
         >
<!--    @click="hightlightTab(tab)"-->
    <q-card-section class="q-pt-xs cursor-pointer" style="width:100%;" >
      <div class="row items-baseline">
        <div class="col-2">
          <q-img
            class="rounded-borders" style="cursor: move"
            width="20px"
            height="20px"
            :src="tab.chromeTab?.favIconUrl">
            <q-tooltip>{{tab.chromeTab?.id}}</q-tooltip>
          </q-img>
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

import {Tab} from "src/models/Tab";
import NavigationService from "src/services/NavigationService";
import {useFeatureTogglesStore} from "stores/featureTogglesStore";

const featureToggles = useFeatureTogglesStore()

const props = defineProps({
  tab: {
    type: Tab,
    required: true
  }
})

const closeTab = (tab: Tab) => NavigationService.closeChromeTab(tab)

const  cardStyle = (tab: Tab) => {
  const height = "40px";
  let background = ''
  if (tab.isDuplicate) {
    background = "background: radial-gradient(circle, #FFFFFF 0%, #FFECB3 100%)"
  }
  return `height: ${height};max-height:${height}; min-height: ${height};border:1px solid grey;border-bottom: 0px;position:relative; top:5px;border-radius: 5px 5px 0 0;${background}`
}

</script>
