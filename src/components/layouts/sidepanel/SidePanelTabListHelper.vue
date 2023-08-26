<template>
  <q-item
      clickable
      v-ripple
      class="q-ma-none q-pa-sm"
      :style="itemStyle(tab)"
      @dragstart="startDrag($event, tab)"
      :key="'paneltablist_' + tab.id">

    <PanelTabListElementWidget :key="'ptlew__' + tab.id"
                               :tab="tab"
                               :type="props.type"
                               :sorting="props.sorting"
                               :preventDragAndDrop="props.preventDragAndDrop"
                               :tabsetType="props.tabsetType"
                               :hide-menu="props.hideMenu"/>

  </q-item>
</template>

<script setup lang="ts">

import {Tab, TabSorting} from "src/models/Tab";
import {TabsetType} from "src/models/Tabset";
import {useUiStore} from "src/stores/uiStore";
import {PropType} from "vue";
import PanelTabListElementWidget from "components/widgets/PanelTabListElementWidget.vue";

const props = defineProps({
  tab: {type: Object as PropType<Tab>, required: true},
  hideMenu: {type: Boolean, default: false},
  sorting: {type: String as PropType<TabSorting>, default: TabSorting.CUSTOM},
  type: {type: String, default: 'sidepanel'},
  tabsetType: {type: String, default: TabsetType.DEFAULT.toString()},
  preventDragAndDrop: {type: Boolean, default: false},
})

const startDrag = (evt: any, tab: Tab) => {
  console.debug("start drag", evt, tab)
  if (evt.dataTransfer) {
    evt.dataTransfer.dropEffect = 'all'
    evt.dataTransfer.effectAllowed = 'all'
    evt.dataTransfer.setData('text/plain', tab.id)
    useUiStore().draggingTab(tab.id, evt)
  }
  console.log("evt.dataTransfer.getData('text/plain')", evt.dataTransfer.getData('text/plain'))
}

const itemStyle = (tab: Tab) => "border-bottom: 1px solid #fafafa"

</script>