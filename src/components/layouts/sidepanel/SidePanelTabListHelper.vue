<template>
  <q-item
      clickable
      v-ripple
      class="q-ma-none q-pa-sm"
      :style="itemStyle()"
      @dragstart="startDrag($event, tab)"
      :key="'paneltablist_' + tab.id">

    <template v-if="props.tab?.extension === UrlExtension.NOTE">
      <q-item-section v-if="props.tab.parent === props.parentId">
        <div class="bg-grey-3 q-pa-xs" style="border:0 solid grey;border-radius:3px"
             @click.stop="NavigationService.openOrCreateDocumentation(props.tabsetId,props.tab?.url || '')">
          {{ tab.title }}/{{tab.parent}}
        </div>
      </q-item-section>
    </template>
    <template v-else>
      <PanelTabListElementWidget :key="'ptlew__' + tab.id"
                                 :tab="tab"
                                 :type="props.type"
                                 :sorting="props.sorting"
                                 :show-tabsets="props.showTabsets"
                                 :preventDragAndDrop="props.preventDragAndDrop"
                                 :tabsetType="props.tabsetType"
                                 :hide-menu="props.hideMenu"/>
    </template>

  </q-item>
</template>

<script setup lang="ts">

import {Tab, TabSorting, UrlExtension} from "src/models/Tab";
import {TabsetType} from "src/models/Tabset";
import {ListDetailLevel, useUiStore} from "src/stores/uiStore";
import {PropType} from "vue";
import PanelTabListElementWidget from "components/widgets/PanelTabListElementWidget.vue";
import {usePermissionsStore} from "stores/permissionsStore";
import {FeatureIdent} from "src/models/AppFeature";
import NavigationService from "src/services/NavigationService";

const props = defineProps({
  tab: {type: Object as PropType<Tab>, required: true},
  hideMenu: {type: Boolean, default: false},
  sorting: {type: String as PropType<TabSorting>, default: TabSorting.CUSTOM},
  type: {type: String, default: 'sidepanel'},
  tabsetId: {type: String, required: true},
  parentId: {type: String, required: false},
  tabsetType: {type: String, default: TabsetType.DEFAULT.toString()},
  showTabsets: {type: Boolean, default: false},
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
  //console.log("evt.dataTransfer.getData('text/plain')", evt.dataTransfer.getData('text/plain'))
}

const itemStyle = () => {
  let style = "border-bottom: 1px solid #fafafa;"
  if (props.tab.color && usePermissionsStore().hasFeature(FeatureIdent.COLOR_TAGS)) {
    style = style + 'border-left:4px solid ' + props.tab.color + ';border-radius:4px;'
  }
  return style
}

</script>